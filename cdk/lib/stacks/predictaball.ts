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
import { Queue } from "aws-cdk-lib/aws-sqs"
import { BlockPublicAccess, Bucket, BucketEncryption, HttpMethods } from "aws-cdk-lib/aws-s3"
import { Cluster, ContainerImage, Ec2Service, Ec2TaskDefinition, LogDrivers, NetworkMode } from "aws-cdk-lib/aws-ecs"
import { ApplicationLoadBalancedEc2Service } from "aws-cdk-lib/aws-ecs-patterns"
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

    const scoreUpdateDLQ = new Queue(this, "scoreUpdateDLQ", { fifo: true })
    const scoreUpdateQueue = new Queue(this, "scoreUpdateQueue", {
      deadLetterQueue: { queue: scoreUpdateDLQ, maxReceiveCount: 1 },
      fifo: true,
    })

    // ECS Cluster + Service
    const cluster = new Cluster(this, "predictaballCluster", { vpc })

    cluster.addCapacity("ec2Capacity", {
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL),
      desiredCapacity: 1,
      associatePublicIpAddress: true,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
    })

    const ecsService = new ApplicationLoadBalancedEc2Service(this, "predictaballService", {
      cluster,
      memoryLimitMiB: 1536,
      desiredCount: 1,
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
          SCORE_UPDATE_QUEUE_URL: scoreUpdateQueue.queueUrl,
          LEADERBOARD_BUCKET_NAME: leaderboardBucket.bucketName,
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
    scoreUpdateQueue.grantSendMessages(taskRole)

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
  }
}
