#!/usr/bin/env node
import "dotenv/config";
import { App } from "aws-cdk-lib";

import { AlgoDsaStack } from "../lib/algo-dsa-stack";
import { loadConfig } from "../lib/config";
import { STACK_ID } from "../lib/constants";

const config = loadConfig();
const app = new App();

new AlgoDsaStack(app, STACK_ID, {
  config,
  // CloudFront requires the ACM certificate in us-east-1; the stack region is
  // taken from configuration. Account/region come exclusively from .env.
  env: {
    account: config.awsAccountId,
    region: config.awsRegion,
  },
});

app.synth();
