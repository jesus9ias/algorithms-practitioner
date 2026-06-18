/**
 * Centralized constants for the infrastructure stack.
 *
 * Per spec.md ("No magic numbers"): all resource names, identifiers, and
 * literal configuration values are declared here and never inlined.
 */

/** Logical IDs and human-readable names for CDK resources. */
export const STACK_ID = "AlgoDsaStack";

export const RESOURCE_ID = {
  SITE_BUCKET: "SiteBucket",
  DISTRIBUTION: "SiteDistribution",
  ORIGIN_ACCESS_CONTROL: "SiteOriginAccessControl",
  CERTIFICATE: "SiteCertificate",
  HOSTED_ZONE: "SiteHostedZone",
  A_RECORD: "SiteAliasRecordA",
  AAAA_RECORD: "SiteAliasRecordAaaa",
} as const;

/** CloudFormation output keys. */
export const OUTPUT_KEY = {
  BUCKET_NAME: "BucketName",
  DISTRIBUTION_ID: "DistributionId",
  DISTRIBUTION_DOMAIN: "DistributionDomainName",
  SITE_URL: "SiteUrl",
} as const;

/** Static site serving configuration. */
export const SITE_CONFIG = {
  DEFAULT_ROOT_OBJECT: "index.html",
  ERROR_DOCUMENT: "404.html",
  HTTP_NOT_FOUND: 404,
  HTTP_OK: 200,
  ERROR_RESPONSE_TTL_SECONDS: 10,
} as const;

/** Environment variable names consumed from `infra/.env`. */
export const ENV_VAR = {
  DOMAIN_NAME: "DOMAIN_NAME",
  HOSTED_ZONE_ID: "HOSTED_ZONE_ID",
  HOSTED_ZONE_NAME: "HOSTED_ZONE_NAME",
  AWS_ACCOUNT_ID: "AWS_ACCOUNT_ID",
  AWS_REGION: "AWS_REGION",
} as const;

/** Protocol prefix used to build the canonical site URL. */
export const HTTPS_PREFIX = "https://";
