import { App, Duration, RemovalPolicy, SecretValue, Stack, StackProps } from "aws-cdk-lib"
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
import { dbPassword } from "../environment"
import { Cognito } from "./cognito"
import { AnyPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { BlockPublicAccess, Bucket, BucketEncryption, HttpMethods } from "aws-cdk-lib/aws-s3"
import { Cluster, ContainerImage, LogDrivers } from "aws-cdk-lib/aws-ecs"
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns"
import { LogGroup } from "aws-cdk-lib/aws-logs"

const dbUser = "postgres"
const dbPort = 5432

export class Predictaball extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props)

    const vpc = Vpc.fromLookup(this, "default-vpc", { isDefault: true })

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
      vpcSubnets: { subnets: vpc.publicSubnets },
      port: dbPort,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      storageType: StorageType.GP2,
      allocatedStorage: 20,
      publiclyAccessible: true,
      credentials: Credentials.fromPassword(dbUser, SecretValue.unsafePlainText(dbPassword)),
    })

    const leaderboardBucket = new Bucket(this, "leaderboardBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
    })

    new Bucket(this, "teamFlagsBucket", {
      publicReadAccess: true,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
      cors: [{
        allowedOrigins: ["*"],
        allowedMethods: [HttpMethods.GET],
        allowedHeaders: ["*"],
      }],
    })

    // ECS Cluster + Fargate Service
    const cluster = new Cluster(this, "predictaballCluster", { vpc })

    const ecsService = new ApplicationLoadBalancedFargateService(this, "predictaballService", {
      cluster,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 1,
      assignPublicIp: true,
      taskSubnets: { subnetType: SubnetType.PUBLIC },
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
          SCHEDULER_ENABLED: "true",
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

    // TODO: Add EventBridge scheduled triggers for /admin/start-matches and /admin/update-scores
    // Requires HTTPS on the ALB (API Destinations only support HTTPS endpoints)
  }
}
