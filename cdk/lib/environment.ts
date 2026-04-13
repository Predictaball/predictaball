import { Environment } from "aws-cdk-lib"


const accountId: string = getEnvVarOrError("CDK_ACCOUNT_ID")
const region = process.env["CDK_REGION"] || "eu-west-2"

export const environment: Environment = {
  account: accountId,
  region: region
}

export const dbPassword: string = getEnvVarOrError("CDK_DB_PASSWORD")
export const apiDomain: string | undefined = process.env["CDK_API_DOMAIN"]
export const adminApiKey: string | undefined = process.env["CDK_ADMIN_API_KEY"]
export const frontendDomain: string | undefined = process.env["CDK_FRONTEND_DOMAIN"]
export const vercelCname: string | undefined = process.env["CDK_VERCEL_CNAME"]
export const rootDomain: string = process.env["CDK_ROOT_DOMAIN"] || "predictaball.live"

function getEnvVarOrError(name: string):  string {
  const val = process.env[name]
  if (!val) throw new Error(`Environment variable ${name} not defined`)
  return val || ""
}