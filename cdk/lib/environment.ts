import { Environment, RemovalPolicy } from "aws-cdk-lib"

export type EnvName = "staging" | "prod"

const accountId: string = getEnvVarOrError("CDK_ACCOUNT_ID")
const region = process.env["CDK_REGION"] || "eu-west-2"

export const envName: EnvName = parseEnvName(process.env["CDK_ENV"])

export const environment: Environment = {
  account: accountId,
  region: region,
}

export const dbPassword: string = getEnvVarOrError("CDK_DB_PASSWORD")
export const apiDomain: string | undefined = process.env["CDK_API_DOMAIN"]
export const adminApiKey: string | undefined = process.env["CDK_ADMIN_API_KEY"]
export const frontendDomain: string | undefined = process.env["CDK_FRONTEND_DOMAIN"]
export const vercelCname: string | undefined = process.env["CDK_VERCEL_CNAME"]
export const rootDomain: string = process.env["CDK_ROOT_DOMAIN"] || "predictaball.live"
export const certArn: string | undefined = process.env["CDK_CERT_ARN"]

interface EnvConfig {
  stackName: string
  managesDns: boolean
  removalPolicy: RemovalPolicy
  defaultDesiredCount: number
}

const ENV_CONFIG: Record<EnvName, EnvConfig> = {
  staging: {
    stackName: "Predictaball",
    managesDns: true,
    removalPolicy: RemovalPolicy.DESTROY,
    defaultDesiredCount: 1,
  },
  prod: {
    stackName: "PredictaballProd",
    managesDns: false,
    removalPolicy: RemovalPolicy.RETAIN,
    defaultDesiredCount: 1,
  },
}

export const config: EnvConfig = ENV_CONFIG[envName]

function parseEnvName(raw: string | undefined): EnvName {
  if (raw === "staging" || raw === "prod") return raw
  throw new Error(`CDK_ENV must be 'staging' or 'prod', got '${raw}'`)
}

function getEnvVarOrError(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Environment variable ${name} not defined`)
  return val
}
