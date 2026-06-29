import { App, CfnOutput, Duration, RemovalPolicy, SecretValue, Stack, StackProps } from "aws-cdk-lib"
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager"
import {
  GatewayVpcEndpointAwsService,
  InstanceClass,
  InstanceSize,
  InstanceType,
  Port,
  SubnetType,
  Vpc
} from "aws-cdk-lib/aws-ec2"
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, StorageType } from "aws-cdk-lib/aws-rds"
import {
  adminApiKey,
  apiDomain,
  authGoogleId,
  authGoogleSecret,
  certArn,
  config,
  dbPassword,
  frontendDomain,
  frontendFargateHost,
  frontendPublicEnv,
  rootDomain,
  sentryDsn,
  vercelCname,
} from "../environment"
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager"
import { AnyPrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { BlockPublicAccess, Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3"
import { Cluster, ContainerImage, FargateService, FargateTaskDefinition, LogDrivers } from "aws-cdk-lib/aws-ecs"
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns"
import {
  ApplicationListenerRule,
  ApplicationProtocol,
  ApplicationTargetGroup,
  ListenerCondition,
  TargetType,
} from "aws-cdk-lib/aws-elasticloadbalancingv2"
import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets"
import {
  ApiDestination,
  Authorization,
  Connection,
  HttpMethod,
  Rule,
  Schedule,
} from "aws-cdk-lib/aws-events"
import { ApiDestination as ApiDestinationTarget } from "aws-cdk-lib/aws-events-targets"
import { LogGroup } from "aws-cdk-lib/aws-logs"
import { ARecord, CnameRecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53"
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets"

const dbUser = "postgres"
const dbPort = 5432

export class Predictaball extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props)

    const vpc = new Vpc(this, "predictaballVpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: "public", subnetType: SubnetType.PUBLIC, cidrMask: 24 },
        { name: "isolated", subnetType: SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    })

    const s3BucketAccessPoint = vpc.addGatewayEndpoint("s3Endpoint", {
      service: GatewayVpcEndpointAwsService.S3,
    })

    s3BucketAccessPoint.addToPolicy(
      new PolicyStatement({
        principals: [new AnyPrincipal()],
        actions: ["s3:*"],
        resources: ["*"],
      }),
    )

    const db = new DatabaseInstance(this, "predictaballDatabase", {
      engine: DatabaseInstanceEngine.POSTGRES,
      vpc: vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      port: dbPort,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      storageType: StorageType.GP2,
      allocatedStorage: 20,
      credentials: Credentials.fromPassword(dbUser, SecretValue.unsafePlainText(dbPassword)),
      removalPolicy: config.removalPolicy,
    })

    const leaderboardBucket = new Bucket(this, "leaderboardBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: config.removalPolicy,
    })

    // ECS Cluster + Fargate Service
    const cluster = new Cluster(this, "predictaballCluster", { vpc })

    const desiredCount = Number(process.env["CDK_DESIRED_COUNT"] || "1")
    const ecsService = new ApplicationLoadBalancedFargateService(this, "predictaballService", {
      cluster,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: desiredCount,
      assignPublicIp: true,
      taskSubnets: { subnetType: SubnetType.PUBLIC },
      enableExecuteCommand: true,
      taskImageOptions: {
        image: ContainerImage.fromAsset("../lambdas"),
        containerPort: 8080,
        environment: {
          DB_USER: dbUser,
          DB_PASSWORD: dbPassword,
          DB_URL: db.dbInstanceEndpointAddress,
          DB_NAME: "postgres",
          DB_PORT: db.dbInstanceEndpointPort,
          NEXTAUTH_SECRET: process.env["CDK_NEXTAUTH_SECRET"] || "",
          RESEND_API_KEY: process.env["CDK_RESEND_API_KEY"] || "",
          LEADERBOARD_BUCKET_NAME: leaderboardBucket.bucketName,
          SCHEDULER_MODE: adminApiKey ? "off" : "in_process",
          ADMIN_API_KEY: adminApiKey || "",
          ...(desiredCount > 1 ? { CACHE_TTL_SECONDS: "30" } : {}),
        },
        logDriver: LogDrivers.awsLogs({
          logGroup: new LogGroup(this, "predictaballLogs"),
          streamPrefix: "ecs",
        }),
      },
      publicLoadBalancer: true,
    })

    // Health check
    ecsService.targetGroup.configureHealthCheck({
      path: "/ping",
      healthyHttpCodes: "200",
      interval: Duration.seconds(30),
    })

    if (desiredCount > 1) {
      ecsService.targetGroup.enableCookieStickiness(Duration.seconds(30))
    }

    // Grant permissions to the ECS task role
    const taskRole = ecsService.taskDefinition.taskRole

    leaderboardBucket.grantReadWrite(taskRole)

    // Allow ECS tasks to connect to RDS
    db.connections.allowFrom(ecsService.service, Port.tcp(dbPort))

    // --- Optional Next.js frontend Fargate service ---
    // Gated by config.deployFrontend so dev can spin it up for validation and
    // tear it down to save credits. Container talks to the backend over the
    // VPC internal network; users hit it via a Host-routed ALB listener rule.
    // CDK_FRONTEND_FARGATE_HOST accepts a comma-separated list when the
    // service should be reachable on multiple hostnames (prod cutover uses
    // "predictaball.live,www.predictaball.live"). The first hostname is the
    // canonical one and gets baked into NEXTAUTH_URL / the client bundle.
    const frontendHosts = frontendFargateHost?.split(",").map(h => h.trim()).filter(h => h.length > 0) ?? []
    let frontendService: FargateService | undefined
    let frontendTargetGroup: ApplicationTargetGroup | undefined
    if (config.deployFrontend) {
      if (!apiDomain) {
        throw new Error("CDK_API_DOMAIN must be set when deployFrontend is true (we share the API's ALB)")
      }
      if (frontendHosts.length === 0) {
        throw new Error("CDK_FRONTEND_FARGATE_HOST must be set when deployFrontend is true (e.g. frontend.dev.predictaball.live, or 'predictaball.live,www.predictaball.live')")
      }
      const canonicalFrontendHost = frontendHosts[0]
      const frontendPublicUrl = `https://${canonicalFrontendHost}`

      // Build args are inlined into the client bundle. Runtime secrets are
      // injected via task env vars (below) and not baked into the image.
      const frontendImage = new DockerImageAsset(this, "frontendImage", {
        directory: "..",
        file: "frontend/Dockerfile",
        platform: Platform.LINUX_AMD64,
        buildArgs: {
          NEXT_PUBLIC_API_URL: `https://${apiDomain}`,
          NEXT_PUBLIC_FRONTEND_URL: frontendPublicUrl,
          NEXT_PUBLIC_SENTRY_DSN: sentryDsn,
          NEXT_PUBLIC_ENV: frontendPublicEnv,
        },
      })

      const frontendTaskDef = new FargateTaskDefinition(this, "frontendTaskDef", {
        cpu: 512,
        memoryLimitMiB: 1024,
      })
      frontendTaskDef.addContainer("nextjs", {
        image: ContainerImage.fromDockerImageAsset(frontendImage),
        portMappings: [{ containerPort: 3000 }],
        environment: {
          NEXTAUTH_URL: frontendPublicUrl,
          NEXTAUTH_SECRET: process.env["CDK_NEXTAUTH_SECRET"] || "",
          ADMIN_API_KEY: adminApiKey || "",
          AUTH_GOOGLE_ID: authGoogleId,
          AUTH_GOOGLE_SECRET: authGoogleSecret,
          // Same backend URL for both server-side and browser, since both go
          // through the public ALB. Could be optimised later with an internal
          // service discovery endpoint, but the latency cost (sub-ms inside
          // the same region) isn't worth the complexity yet.
          API_URL: `https://${apiDomain}`,
        },
        logging: LogDrivers.awsLogs({
          logGroup: new LogGroup(this, "frontendLogs"),
          streamPrefix: "ecs",
        }),
      })

      frontendService = new FargateService(this, "frontendService", {
        cluster,
        taskDefinition: frontendTaskDef,
        desiredCount: 1,
        assignPublicIp: true,
        vpcSubnets: { subnetType: SubnetType.PUBLIC },
        enableExecuteCommand: true,
      })

      frontendTargetGroup = new ApplicationTargetGroup(this, "frontendTargetGroup", {
        vpc,
        port: 3000,
        protocol: ApplicationProtocol.HTTP,
        targetType: TargetType.IP,
        targets: [frontendService],
        healthCheck: {
          path: "/",
          healthyHttpCodes: "200",
          interval: Duration.seconds(30),
        },
      })

      new CfnOutput(this, "frontendUrl", { value: frontendPublicUrl })
    }

    // Domain + HTTPS (when CDK_API_DOMAIN is set)
    if (apiDomain) {
      let certificate: ICertificate
      let hostedZone: HostedZone | undefined
      if (config.managesDns) {
        hostedZone = new HostedZone(this, "hostedZone", {
          zoneName: rootDomain,
        })

        certificate = new Certificate(this, "certificate", {
          domainName: `*.${rootDomain}`,
          subjectAlternativeNames: [rootDomain, `*.dev.${rootDomain}`],
          validation: CertificateValidation.fromDns(hostedZone),
        })

        new ARecord(this, "apiDnsRecord", {
          zone: hostedZone,
          recordName: apiDomain,
          target: RecordTarget.fromAlias(new LoadBalancerTarget(ecsService.loadBalancer)),
        })

        if (frontendDomain && vercelCname) {
          new CnameRecord(this, "frontendDnsRecord", {
            zone: hostedZone,
            recordName: frontendDomain,
            domainName: vercelCname,
          })
        }
      } else {
        if (!certArn) throw new Error("CDK_CERT_ARN must be set when env does not manage DNS")
        certificate = Certificate.fromCertificateArn(this, "certificate", certArn)
      }

      const httpsListener = ecsService.loadBalancer.addListener("httpsListener", {
        port: 443,
        protocol: ApplicationProtocol.HTTPS,
        certificates: [certificate],
        defaultTargetGroups: [ecsService.targetGroup],
      })

      // Route the frontend hostname(s) to the frontend target group. Backend
      // traffic falls through to the listener's default target group. One
      // rule covers all hostnames listed in CDK_FRONTEND_FARGATE_HOST so we
      // don't consume multiple rule priorities.
      if (frontendTargetGroup && frontendService && frontendHosts.length > 0) {
        new ApplicationListenerRule(this, "frontendListenerRule", {
          listener: httpsListener,
          priority: 10,
          conditions: [ListenerCondition.hostHeaders(frontendHosts)],
          targetGroups: [frontendTargetGroup],
        })

        // DNS records only get created in envs that manage the zone (dev).
        // In prod, the dev account owns the predictaball.live zone, so the
        // cutover DNS swap is done manually at flip time.
        if (hostedZone) {
          frontendHosts.forEach((host, i) => {
            // Apex records need ARecord. Subdomains could be CNAMEs but
            // ARecord (alias) works for both and avoids special-casing.
            new ARecord(this, `frontendFargateDnsRecord${i}`, {
              zone: hostedZone!,
              recordName: host,
              target: RecordTarget.fromAlias(new LoadBalancerTarget(ecsService.loadBalancer)),
            })
          })
        }
      }

      // EventBridge scheduled tasks (replaces in-process schedulers)
      if (adminApiKey) {
        const connection = new Connection(this, "adminConnection", {
          authorization: Authorization.apiKey("X-Api-Key", SecretValue.unsafePlainText(adminApiKey)),
        })

        const updateScoresDest = new ApiDestination(this, "updateScoresDest", {
          connection,
          endpoint: `https://${apiDomain}/admin/update-scores`,
          httpMethod: HttpMethod.POST,
        })

        new Rule(this, "updateScoresRule", {
          schedule: Schedule.rate(Duration.minutes(1)),
          targets: [new ApiDestinationTarget(updateScoresDest)],
        })

        const sendRemindersDest = new ApiDestination(this, "sendRemindersDest", {
          connection,
          endpoint: `https://${apiDomain}/admin/send-reminders`,
          httpMethod: HttpMethod.POST,
        })

        new Rule(this, "sendRemindersRule", {
          schedule: Schedule.cron({ hour: "8", minute: "0" }),
          targets: [new ApiDestinationTarget(sendRemindersDest)],
        })
      }
    }
  }
}
