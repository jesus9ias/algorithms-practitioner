# algo-dsa Infrastructure (AWS CDK)

AWS CDK v2 (TypeScript) project that provisions the hosting infrastructure for
the **algorithms-practitioner** static frontend.

## What it creates

A single stack, `AlgoDsaStack`, containing:

- **S3 bucket** — private, versioned, encrypted, SSL-enforced. No public access.
- **CloudFront distribution** — Origin Access Control (OAC) against the bucket,
  HTTPS-only (redirect to HTTPS), HTTP/2 + HTTP/3, default root object
  `index.html`, and a custom error response that serves `404.html` with HTTP 200
  for client-side routing.
- **ACM certificate** — referenced by ARN (must be issued in `us-east-1`).
- **Route 53 records** — `A` and `AAAA` alias records pointing the subdomain at
  the CloudFront distribution.

All resource names and literal values come from `lib/constants/index.ts`. All
environment-specific values come from `infra/.env`. Nothing sensitive is
hardcoded.

## Prerequisites

- Node.js 24+
- An AWS account with credentials configured locally
  (`aws configure` or environment credentials)
- AWS CDK bootstrapped in the target account/region:
  `npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>`
- An existing Route 53 hosted zone for your domain
- An ACM certificate **in us-east-1** covering `DOMAIN_NAME`

## Setup

```bash
cd infra
npm install
cp .env.example .env
# edit .env and fill in all values
```

### Required environment variables (`infra/.env`)

| Variable          | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `DOMAIN_NAME`     | Full subdomain to serve (e.g. `algo.example.com`)      |
| `HOSTED_ZONE_ID`  | Route 53 hosted zone ID that owns the domain           |
| `AWS_ACCOUNT_ID`  | Target AWS account ID                                  |
| `AWS_REGION`      | Region the stack is deployed to                        |
| `CERTIFICATE_ARN` | ACM certificate ARN (must be in `us-east-1`)           |

## Commands

```bash
npm run build     # compile TypeScript
npm run synth     # synthesize CloudFormation
npm run diff      # diff against deployed stack
npm run deploy    # deploy the stack
npm run destroy   # tear down the stack
```

## Deploy

```bash
npm run deploy
```

After deploy, the stack outputs the bucket name, distribution ID, distribution
domain, and the canonical site URL.

## CI/CD

`.github/workflows/deploy-infra.yml` runs `cdk deploy` on **manual dispatch**
only. It reads all configuration from GitHub Actions secrets:
`AWS_DEPLOY_ROLE_ARN`, `AWS_REGION`, `DOMAIN_NAME`, `HOSTED_ZONE_ID`,
`AWS_ACCOUNT_ID`, `CERTIFICATE_ARN`.

> This stage provisions hosting only. No frontend assets are deployed here;
> frontend build & upload is handled by the `frontend/` project's own workflow.
