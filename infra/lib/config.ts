import { ENV_VAR } from "./constants";

/**
 * Strongly-typed, validated view of the environment configuration.
 *
 * Per spec.md: domain and AWS account values must come exclusively from
 * environment variables. This module is the single point where those values
 * are read and validated; the stack never touches `process.env` directly.
 */
export interface InfraConfig {
  readonly domainName: string;
  readonly hostedZoneId: string;
  readonly hostedZoneName: string;
  readonly awsAccountId: string;
  readonly awsRegion: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        `Copy infra/.env.example to infra/.env and fill in all values.`
    );
  }
  return value.trim();
}

/** Reads and validates all required environment variables. */
export function loadConfig(): InfraConfig {
  return {
    domainName: requireEnv(ENV_VAR.DOMAIN_NAME),
    hostedZoneId: requireEnv(ENV_VAR.HOSTED_ZONE_ID),
    hostedZoneName: requireEnv(ENV_VAR.HOSTED_ZONE_NAME),
    awsAccountId: requireEnv(ENV_VAR.AWS_ACCOUNT_ID),
    awsRegion: requireEnv(ENV_VAR.AWS_REGION),
  };
}
