import { App, Duration, RemovalPolicy, SecretValue, Stack, StackProps } from "aws-cdk-lib"
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
import { adminApiKey, apiDomain, dbPassword, frontendDomain, rootDomain, vercelCname } from "../environment"
import { Cognito } from "./cognito"
import { AnyPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { BlockPublicAccess, Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3"
import { Cluster, ContainerImage, LogDrivers } from "aws-cdk-lib/aws-ecs"
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns"
import { ApplicationProtocol } from "aws-cdk-lib/aws-elasticloadbalancingv2"
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

    const cognito = new Cognito(this)

    const db = new DatabaseInstance(this, "predictaballDatabase", {
      engine: DatabaseInstanceEngine.POSTGRES,
      vpc: vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      port: dbPort,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      storageType: StorageType.GP2,
      allocatedStorage: 20,
      credentials: Credentials.fromPassword(dbUser, SecretValue.unsafePlainText(dbPassword)),
    })

    const leaderboardBucket = new Bucket(this, "leaderboardBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
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
          USER_POOL_CLIENT_ID: cognito.poolClient.userPoolClientId,
          USER_POOL_ID: cognito.userPool.userPoolId,
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

    // Grant permissions to the ECS task role
    const taskRole = ecsService.taskDefinition.taskRole

    leaderboardBucket.grantReadWrite(taskRole)

    taskRole.addToPrincipalPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "cognito-idp:AdminInitiateAuth",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
          "cognito-idp:AdminDeleteUser",
        ],
        resources: [cognito.userPool.userPoolArn],
      }),
    )

    // Allow ECS tasks to connect to RDS
    db.connections.allowFrom(ecsService.service, Port.tcp(dbPort))

    // Domain + HTTPS (when CDK_API_DOMAIN is set)
    if (apiDomain) {
      const hostedZone = new HostedZone(this, "hostedZone", {
        zoneName: rootDomain,
      })

      const certificate = new Certificate(this, "certificate", {
        domainName: `*.${rootDomain}`,
        subjectAlternativeNames: [rootDomain, `*.dev.${rootDomain}`],
        validation: CertificateValidation.fromDns(hostedZone),
      })

      ecsService.loadBalancer.addListener("httpsListener", {
        port: 443,
        protocol: ApplicationProtocol.HTTPS,
        certificates: [certificate],
        defaultTargetGroups: [ecsService.targetGroup],
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

      // EventBridge scheduled tasks (replaces in-process schedulers)
      if (adminApiKey) {
        const connection = new Connection(this, "adminConnection", {
          authorization: Authorization.apiKey("X-Api-Key", SecretValue.unsafePlainText(adminApiKey)),
        })

        const startMatchesDest = new ApiDestination(this, "startMatchesDest", {
          connection,
          endpoint: `https://${apiDomain}/admin/start-matches`,
          httpMethod: HttpMethod.POST,
        })

        const updateScoresDest = new ApiDestination(this, "updateScoresDest", {
          connection,
          endpoint: `https://${apiDomain}/admin/update-scores`,
          httpMethod: HttpMethod.POST,
        })

        new Rule(this, "startMatchesRule", {
          schedule: Schedule.cron({ minute: "*/15" }),
          targets: [new ApiDestinationTarget(startMatchesDest)],
        })

        new Rule(this, "updateScoresRule", {
          schedule: Schedule.rate(Duration.minutes(2)),
          targets: [new ApiDestinationTarget(updateScoresDest)],
        })
      }
    }
  }
}
