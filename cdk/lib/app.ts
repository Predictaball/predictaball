import { App } from "aws-cdk-lib"
import { Predictaball } from "./stacks/predictaball"
import { config, environment } from "./environment"

const app = new App()

new Predictaball(app, config.stackName, {
  env: environment,
})
