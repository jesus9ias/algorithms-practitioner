# algorithms-practitioner

An interactive learning platform for algorithms and data structures. Browse a
catalog of exercises, watch step-by-step SVG visualizations of how each
algorithm progresses, run your own inputs, track what you've learned, and study
the reference library — all in English or Spanish, light or dark.

- **No backend.** Progress and preferences are stored in `localStorage`, with
  JSON export/import for moving between devices.
- **Static site.** Built with [Astro](https://astro.build) (SSG) and vanilla
  TypeScript — no frontend framework. Hosted on S3 + CloudFront.
- **Infrastructure as code.** AWS CDK v2 provisions S3, CloudFront, Route 53,
  and the ACM certificate reference.

The full specification (requirements, Gherkin features, test definitions, and
implementation stages) lives in [`spec.md`](spec.md). Working conventions for
contributors and AI agents live in [`CLAUDE.md`](CLAUDE.md).

## Repository layout

```
algorithms-practitioner/
├── frontend/   # Astro app (UI, exercises, tests)
└── infra/      # AWS CDK v2 (S3 + CloudFront + Route 53 + ACM)
```

## Prerequisites

- **Node.js 24+** and npm
- For deployment only:
  - An AWS account with credentials configured locally
  - AWS CDK bootstrapped in the target account/region
  - A Route 53 hosted zone for your domain
  - An ACM certificate **in `us-east-1`** covering your subdomain

## Local development

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # set PUBLIC_SITE_URL
npm run dev                 # http://localhost:4321
```

Other useful scripts:

```bash
npm test          # run the full Vitest suite
npm run typecheck # astro check + tsc --noEmit (shipped code)
npm run build     # static build to dist/
npm run preview   # serve the production build locally
```

### Infra

```bash
cd infra
npm install
cp .env.example .env        # fill in all values
npm run synth               # synthesize CloudFormation (no AWS calls)
```

## Environment variables

`.env` files are git-ignored and must never be committed.

### `frontend/.env`

| Variable          | Description                                   |
| ----------------- | --------------------------------------------- |
| `PUBLIC_SITE_URL` | Canonical site URL (canonical links + OG tags)|

### `infra/.env`

| Variable          | Description                                       |
| ----------------- | ------------------------------------------------- |
| `DOMAIN_NAME`     | Full subdomain to serve (e.g. `algo.example.com`) |
| `HOSTED_ZONE_ID`  | Route 53 hosted zone ID                           |
| `AWS_ACCOUNT_ID`  | Target AWS account ID                             |
| `AWS_REGION`      | Deployment region                                 |
| `CERTIFICATE_ARN` | ACM certificate ARN (must be in `us-east-1`)      |

## Running tests

The authoritative test gate is Vitest, in `frontend/`:

```bash
cd frontend
npm test
```

Tests are defined per `spec.md` (registry, i18n, validation, filters/search,
progress, export/import, the step engine, and each exercise's algorithm). No
production code is added that does not pass its corresponding test.

## Deploying the infrastructure (CDK)

```bash
cd infra
npm install
cp .env.example .env        # fill in all values
npx cdk bootstrap aws://<AWS_ACCOUNT_ID>/<AWS_REGION>   # first time only
npm run deploy
```

`AlgoDsaStack` creates a private, versioned S3 bucket; a CloudFront distribution
(Origin Access Control, HTTPS-only, `index.html` root, and a 404 → `404.html`
response) using your ACM certificate; and Route 53 `A`/`AAAA` alias records for
the subdomain. Outputs include the bucket name, distribution ID, and site URL.

A manual GitHub Actions workflow (`infra/.github/workflows/deploy-infra.yml`,
`workflow_dispatch`) runs `cdk deploy` using repository secrets.

## Deploying the frontend (GitHub Actions)

On every push to `main` that touches `frontend/`,
`frontend/.github/workflows/deploy-frontend.yml` runs the tests, builds the
site, syncs `dist/` to S3, and invalidates the CloudFront distribution.

Required repository secrets: `AWS_DEPLOY_ROLE_ARN`, `AWS_REGION`,
`PUBLIC_SITE_URL`, `S3_BUCKET_NAME`, `CLOUDFRONT_DISTRIBUTION_ID`.

## Adding new exercises

Each exercise is fully isolated (its own folder, algorithm, visualization, and
tests). See the step-by-step guide in [`CLAUDE.md`](CLAUDE.md#how-to-add-a-new-exercise).
In short: register it in `frontend/src/data/exercises.json` (with inline
`{ en, es }` name/description/link labels), create
`src/exercises/<id>/exercise.js` and `viz.ts`, add the exercise and viz tests,
and run `npm test`.

## License

Not yet specified.
