# Deploy the Express, Prisma, and PostgreSQL API to Google Cloud

This guide deploys this repository using:

- **Cloud Run** for the Express API
- **Cloud SQL for PostgreSQL** for the database
- **Secret Manager** for `DATABASE_URL`
- **Cloud Run Jobs** for production Prisma migrations
- **GitHub Actions** for CI/CD
- **Workload Identity Federation** for keyless GitHub-to-Google authentication

The target architecture is:

```text
GitHub Actions ──OIDC──> Google Cloud deployer identity
       │
       ├── build and deploy a Cloud Run revision
       ├── execute the Prisma migration job
       └── move production traffic to the new revision

Client ──HTTPS──> Cloud Run API ──Unix socket──> Cloud SQL PostgreSQL
                         │
                         └── DATABASE_URL from Secret Manager
```

## Read this first: use PowerShell, not Git Bash

All commands you run on your Windows computer in this guide use **PowerShell syntax**. Do not paste them into Git Bash, WSL, Command Prompt, or a `MINGW64` terminal.

You are in the correct shell when the prompt begins with something similar to:

```text
PS C:\Users\Dariel\Documents\own-projects\postgre-api-template>
```

You are in Git Bash—the wrong shell for these commands—when the prompt contains `MINGW64` and looks similar to:

```text
Dar@Dar MINGW64 ~/Documents/own-projects/postgre-api-template (main)
$
```

If you are currently in Git Bash, start PowerShell from the same directory:

```bash
powershell.exe -NoLogo
```

Wait until the prompt changes to `PS ...>`. Then paste only blocks marked `powershell`.

You can also open Windows Terminal, select **PowerShell** from its tab menu, and navigate to the repository:

```powershell
cd C:\Users\Dariel\Documents\own-projects\postgre-api-template
```

Confirm the shell and Google CLI before continuing:

```powershell
$PSVersionTable.PSVersion
Get-Command gcloud
```

Do not switch shells partway through the setup. PowerShell variables such as `$ProjectId` do not exist in Git Bash, and Bash variables do not exist in PowerShell.

## Important concepts for MongoDB developers

Prisma Studio is not the database server. It is only a graphical interface for viewing and editing a database.

The PostgreSQL equivalents are:

| Purpose | Local development | Google Cloud production |
| --- | --- | --- |
| Database server | Local PostgreSQL | Cloud SQL for PostgreSQL |
| Schema definition | `prisma/schema.prisma` | Same committed file |
| Schema history | `prisma/migrations` | Same committed migrations |
| Database client | Prisma Client | Prisma Client |
| Visual browser | Prisma Studio | Prisma Studio through Cloud SQL Auth Proxy |

Prisma migrations create and update tables. They do not automatically copy existing rows from the local database.

## Repository readiness

This repository already has:

- A PostgreSQL datasource in `prisma/schema.prisma`
- An initial migration in `prisma/migrations`
- A `prisma:deploy` script that runs `prisma migrate deploy`
- A server that reads the `PORT` environment variable
- A `.gitignore` rule that excludes `.env`

Cloud Run automatically supplies `PORT=8080`, and the existing server code will use it.

## Part 1: One-time Google Cloud setup

### 1. Create a Google Cloud project

In the [Google Cloud Console](https://console.cloud.google.com/):

1. Create or select a project.
2. Attach a billing account.
3. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
4. Open **PowerShell** in this repository. Stop if the prompt contains `MINGW64`; that is Git Bash.

Authenticate:

```powershell
gcloud auth login
```

Define the values used throughout this guide:

```powershell
$ProjectId = "your-gcp-project-id"
$Region = "asia-southeast1"
$Service = "postgre-api"
$SqlInstance = "postgre-api-db"
$DbName = "postgre_api"
$DbUser = "postgre_api_user"
$RuntimeServiceAccountId = "postgre-api-run"
$RuntimeServiceAccount = "$RuntimeServiceAccountId@$ProjectId.iam.gserviceaccount.com"

gcloud config set project "$ProjectId"
gcloud config get-value project
```

The second command must print the same project ID that you assigned to `$ProjectId`. If it prints nothing, stop—the variable was not created in the current PowerShell session.

`asia-southeast1` is Singapore. It is a reasonable starting region for users in the Philippines. Keep Cloud Run and Cloud SQL in the same region.

### 2. Enable the required Google Cloud APIs

```powershell
gcloud services enable run.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com
```

### 3. Add a production Dockerfile

Create `Dockerfile` in the repository root:

```dockerfile
FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Prisma 7 loads prisma.config.ts while generating. Generation does not
# connect to this placeholder database.
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" pnpm prisma:generate \
    && pnpm build

FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./

EXPOSE 8080

CMD ["node", "dist/src/server.js"]
```

The final image intentionally includes the Prisma CLI because the same image is used by the migration job.

Create `.dockerignore` in the repository root:

```text
node_modules
dist
generated
.env
.git
gha-creds-*.json
*.log
```

Also add this line to `.gitignore` because the Google authentication action can generate temporary credential files:

```text
gha-creds-*.json
```

Never copy `.env` into the container image.

### 4. Create the Cloud SQL PostgreSQL instance

For a learning, development, or low-traffic deployment:

```powershell
gcloud sql instances create $SqlInstance --database-version=POSTGRES_15 --region=$Region --tier=db-f1-micro --storage-type=SSD --storage-size=10 --storage-auto-increase --availability-type=zonal
```

`db-f1-micro` is inexpensive but is not the recommended size for an important production system. For a business-critical service, select a dedicated-core machine, regional high availability, point-in-time recovery, and appropriate backup retention.

Create an application database:

```powershell
gcloud sql databases create $DbName --instance=$SqlInstance
```

Create a database user:

```powershell
$DbPassword = Read-Host "Enter a strong database password"
gcloud sql users create $DbUser --instance=$SqlInstance --password=$DbPassword
```

Get the instance connection name:

```powershell
$InstanceConnectionName = gcloud sql instances describe $SqlInstance --format="value(connectionName)"
$InstanceConnectionName
```

The result resembles:

```text
your-project:asia-southeast1:postgre-api-db
```

Cloud Run exposes the connected database through an encrypted Unix socket at `/cloudsql/INSTANCE_CONNECTION_NAME`. See [Connect from Cloud Run to Cloud SQL](https://cloud.google.com/sql/docs/postgres/connect-run).

### 5. Create the runtime service account

The runtime identity belongs to the API—not GitHub Actions.

```powershell
gcloud iam service-accounts create $RuntimeServiceAccountId --display-name="Postgre API Cloud Run runtime"
```

Allow the API to connect to Cloud SQL:

```powershell
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$RuntimeServiceAccount" --role="roles/cloudsql.client"
```

### 6. Store `DATABASE_URL` in Secret Manager

The password must be URL-encoded because characters such as `@`, `/`, `#`, and `:` have special meanings inside URLs.

```powershell
$EncodedPassword = [uri]::EscapeDataString($DbPassword)
$DatabaseUrl = "postgresql://{0}:{1}@localhost/{2}?host=/cloudsql/{3}" -f $DbUser, $EncodedPassword, $DbName, $InstanceConnectionName
```

Store it without adding a newline:

```powershell
$SecretFile = Join-Path $env:TEMP "database-url.txt"
[IO.File]::WriteAllText($SecretFile, $DatabaseUrl)

gcloud secrets create database-url --data-file=$SecretFile

Remove-Item -LiteralPath $SecretFile
$DbPassword = $null
$DatabaseUrl = $null
```

For future secret updates, use a new version instead of creating the secret again:

```powershell
gcloud secrets versions add database-url --data-file=$SecretFile
```

Allow only the runtime service account to read the secret:

```powershell
gcloud secrets add-iam-policy-binding database-url --member="serviceAccount:$RuntimeServiceAccount" --role="roles/secretmanager.secretAccessor"
```

Google recommends Secret Manager for sensitive Cloud Run configuration. See [Configure secrets for Cloud Run](https://cloud.google.com/run/docs/configuring/services/secrets).

### 7. Perform the first Cloud Run deployment

The first deployment bootstraps the Cloud Run service that the later CI/CD workflow will update.

```powershell
gcloud run deploy $Service --source=. --region=$Region --execution-environment=gen2 --allow-unauthenticated --service-account=$RuntimeServiceAccount --add-cloudsql-instances=$InstanceConnectionName --set-secrets=DATABASE_URL=database-url:1 --set-env-vars=NODE_ENV=production --max=3
```

Deploying from source uses Cloud Build and Artifact Registry. See [Deploy services from source code](https://cloud.google.com/run/docs/deploying-source-code).

### 8. Create and execute the Prisma migration job

Get the immutable container image generated by the deployment:

```powershell
$Image = gcloud run services describe $Service --region=$Region --format="value(spec.template.spec.containers[0].image)"
```

Create a Cloud Run Job from the same image:

```powershell
gcloud run jobs create "$Service-migrate" --image=$Image --region=$Region --service-account=$RuntimeServiceAccount --set-cloudsql-instances=$InstanceConnectionName --set-secrets=DATABASE_URL=database-url:1 --command=npx --args=prisma,migrate,deploy --max-retries=0 --task-timeout=10m
```

Run the migration:

```powershell
gcloud run jobs execute "$Service-migrate" --region=$Region --wait
```

This runs the committed `prisma/migrations` files against Cloud SQL. Production must use `prisma migrate deploy`, not `prisma db push`, `prisma migrate dev`, or `prisma migrate reset`. See [Prisma production migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production#production-and-testing-environments).

### 9. Verify the initial deployment

```powershell
$Url = gcloud run services describe $Service --region=$Region --format="value(status.url)"
$Url

Invoke-RestMethod "$Url/api"
Invoke-RestMethod "$Url/api/users"
```

Read logs if the API fails:

```powershell
gcloud run services logs read $Service --region=$Region --limit=100
```

Read migration logs:

```powershell
gcloud run jobs executions list --job="$Service-migrate" --region=$Region
```

## Part 2: Configure GitHub Actions authentication

GitHub Actions should not contain a downloadable Google service-account JSON key. Workload Identity Federation lets GitHub exchange its OIDC identity for short-lived Google credentials. Google recommends this approach over long-lived keys. See [Google's deployment-pipeline federation guide](https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines) and [`google-github-actions/auth`](https://github.com/google-github-actions/auth).

### 10. Define GitHub repository information

Use the exact GitHub username or organization and repository name:

```powershell
$GitHubOwner = "your-github-username-or-organization"
$GitHubRepo = "postgre-api-template"
$GitHubRepository = "$GitHubOwner/$GitHubRepo"

$ProjectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
$PoolId = "github-actions"
$ProviderId = "github-provider"
$DeployServiceAccountId = "github-deployer"
$DeployServiceAccount = "$DeployServiceAccountId@$ProjectId.iam.gserviceaccount.com"
```

### 11. Create a separate GitHub deployer service account

Do not reuse the runtime service account. The runtime account accesses the database; the deployer account changes Cloud Run resources.

```powershell
gcloud iam service-accounts create $DeployServiceAccountId --display-name="GitHub Actions deployer"
```

Grant the deployer the Cloud Run deployment roles:

```powershell
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$DeployServiceAccount" --role="roles/run.admin"
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$DeployServiceAccount" --role="roles/run.sourceDeveloper"
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$DeployServiceAccount" --role="roles/serviceusage.serviceUsageConsumer"
```

Allow the deployer to attach the runtime identity to Cloud Run services and jobs:

```powershell
gcloud iam service-accounts add-iam-policy-binding $RuntimeServiceAccount --member="serviceAccount:$DeployServiceAccount" --role="roles/iam.serviceAccountUser"
```

Source deployments use a Cloud Build service account. Grant the current default build account the Cloud Run Builder role:

```powershell
$BuildServiceAccount = "$ProjectNumber-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$BuildServiceAccount" --role="roles/run.builder"
```

Google recommends a dedicated build service account for more advanced production setups. The default account keeps this first pipeline easier to understand. See [Cloud Run build service accounts](https://cloud.google.com/run/docs/configuring/services/build-service-account).

### 12. Create the Workload Identity Pool

```powershell
gcloud iam workload-identity-pools create $PoolId --project=$ProjectId --location=global --display-name="GitHub Actions"
```

### 13. Create a GitHub OIDC provider

The attribute condition restricts the provider to this exact repository.

```powershell
gcloud iam workload-identity-pools providers create-oidc $ProviderId --project=$ProjectId --location=global --workload-identity-pool=$PoolId --display-name="GitHub repository provider" --issuer-uri="https://token.actions.githubusercontent.com" --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" --attribute-condition="assertion.repository=='$GitHubRepository'"
```

### 14. Allow only this repository to impersonate the deployer

```powershell
$GitHubPrincipal = "principalSet://iam.googleapis.com/projects/$ProjectNumber/locations/global/workloadIdentityPools/$PoolId/attribute.repository/$GitHubRepository"

gcloud iam service-accounts add-iam-policy-binding $DeployServiceAccount --role="roles/iam.workloadIdentityUser" --member=$GitHubPrincipal
```

Get the full provider identifier required by GitHub Actions:

```powershell
$WorkloadIdentityProvider = gcloud iam workload-identity-pools providers describe $ProviderId --project=$ProjectId --location=global --workload-identity-pool=$PoolId --format="value(name)"
$WorkloadIdentityProvider
```

IAM changes can take several minutes to propagate.

### 15. Add GitHub repository variables

Open the GitHub repository and go to:

```text
Settings → Secrets and variables → Actions → Variables
```

Create these repository variables:

| Variable | Value |
| --- | --- |
| `GCP_PROJECT_ID` | Your project ID |
| `GCP_REGION` | `asia-southeast1` |
| `CLOUD_RUN_SERVICE` | `postgre-api` |
| `CLOUD_SQL_CONNECTION` | Value of `$InstanceConnectionName` |
| `RUNTIME_SERVICE_ACCOUNT` | Value of `$RuntimeServiceAccount` |
| `WIF_PROVIDER` | Value of `$WorkloadIdentityProvider` |
| `WIF_SERVICE_ACCOUNT` | Value of `$DeployServiceAccount` |

No Google credential secret is required. The database URL remains in Google Secret Manager and is not copied into GitHub.

Optionally create a GitHub environment named `production` under:

```text
Settings → Environments → New environment
```

You can add a required reviewer later so production deployments require approval.

## Part 3: Add the GitHub Actions CI/CD workflow

### 16. Create `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD

on:
  pull_request:
  push:
    branches:
      - main

env:
  NODE_VERSION: "22"
  GCP_PROJECT_ID: ${{ vars.GCP_PROJECT_ID }}
  GCP_REGION: ${{ vars.GCP_REGION }}
  CLOUD_RUN_SERVICE: ${{ vars.CLOUD_RUN_SERVICE }}
  CLOUD_SQL_CONNECTION: ${{ vars.CLOUD_SQL_CONNECTION }}
  RUNTIME_SERVICE_ACCOUNT: ${{ vars.RUNTIME_SERVICE_ACCOUNT }}

jobs:
  ci:
    name: Validate and build
    runs-on: ubuntu-latest
    permissions:
      contents: read

    steps:
      - name: Check out repository
        uses: actions/checkout@v6

      - name: Install pnpm
        uses: pnpm/action-setup@v6

      - name: Install Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: pnpm exec prisma generate
        env:
          DATABASE_URL: postgresql://user:pass@localhost:5432/ci_placeholder

      - name: Build TypeScript
        run: pnpm build

  deploy:
    name: Deploy production
    if: github.event_name == 'push'
    needs: ci
    runs-on: ubuntu-latest
    environment: production
    concurrency:
      group: production-deployment
      cancel-in-progress: false
    permissions:
      contents: read
      id-token: write

    steps:
      - name: Check out repository
        uses: actions/checkout@v6

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v3
        with:
          project_id: ${{ env.GCP_PROJECT_ID }}
          workload_identity_provider: ${{ vars.WIF_PROVIDER }}
          service_account: ${{ vars.WIF_SERVICE_ACCOUNT }}

      - name: Install Google Cloud CLI
        uses: google-github-actions/setup-gcloud@v3

      - name: Deploy revision without production traffic
        id: deploy
        uses: google-github-actions/deploy-cloudrun@v3
        with:
          project_id: ${{ env.GCP_PROJECT_ID }}
          region: ${{ env.GCP_REGION }}
          service: ${{ env.CLOUD_RUN_SERVICE }}
          source: .
          env_vars: |-
            NODE_ENV=production
          secrets: |-
            DATABASE_URL=database-url:1
          flags: >-
            --service-account=${{ env.RUNTIME_SERVICE_ACCOUNT }}
            --add-cloudsql-instances=${{ env.CLOUD_SQL_CONNECTION }}
            --execution-environment=gen2
            --max=3
          no_traffic: true

      - name: Find the deployed container image
        id: image
        shell: bash
        run: |
          IMAGE="$(gcloud run services describe "$CLOUD_RUN_SERVICE" \
            --project="$GCP_PROJECT_ID" \
            --region="$GCP_REGION" \
            --format='value(spec.template.spec.containers[0].image)')"
          echo "image=$IMAGE" >> "$GITHUB_OUTPUT"

      - name: Update migration job
        shell: bash
        run: |
          gcloud run jobs update "$CLOUD_RUN_SERVICE-migrate" \
            --project="$GCP_PROJECT_ID" \
            --region="$GCP_REGION" \
            --image="${{ steps.image.outputs.image }}" \
            --service-account="$RUNTIME_SERVICE_ACCOUNT" \
            --set-cloudsql-instances="$CLOUD_SQL_CONNECTION" \
            --set-secrets=DATABASE_URL=database-url:1 \
            --command=npx \
            --args=prisma,migrate,deploy \
            --max-retries=0 \
            --task-timeout=10m

      - name: Apply database migrations
        shell: bash
        run: |
          gcloud run jobs execute "$CLOUD_RUN_SERVICE-migrate" \
            --project="$GCP_PROJECT_ID" \
            --region="$GCP_REGION" \
            --wait

      - name: Send production traffic to the new revision
        shell: bash
        run: |
          gcloud run services update-traffic "$CLOUD_RUN_SERVICE" \
            --project="$GCP_PROJECT_ID" \
            --region="$GCP_REGION" \
            --to-latest

      - name: Smoke test
        shell: bash
        run: |
          URL="$(gcloud run services describe "$CLOUD_RUN_SERVICE" \
            --project="$GCP_PROJECT_ID" \
            --region="$GCP_REGION" \
            --format='value(status.url)')"
          curl --fail --show-error --silent "$URL/api"
```

The current workflow uses `actions/checkout@v6`, `actions/setup-node@v6`, `pnpm/action-setup@v6`, and version 3 of Google's authentication and Cloud Run actions. Their current usage is documented in the official [`setup-node`](https://github.com/actions/setup-node), [`pnpm/action-setup`](https://github.com/pnpm/action-setup), [`auth`](https://github.com/google-github-actions/auth), and [`deploy-cloudrun`](https://github.com/google-github-actions/deploy-cloudrun) repositories.

### 17. Understand the pipeline

For every pull request, the `ci` job:

1. Installs exactly the dependencies from `pnpm-lock.yaml`.
2. Generates the Prisma client with a harmless placeholder URL.
3. Compiles the TypeScript application.

There is currently no test or lint script in `package.json`, so the initial CI checks generation and compilation. Add `pnpm test` and `pnpm lint` steps after those scripts exist.

For every push to `main`, the `deploy` job:

1. Waits for CI to pass.
2. Gets short-lived Google credentials through GitHub OIDC.
3. Builds and deploys a new revision with no production traffic.
4. Points the migration job at the exact new container image.
5. Runs `prisma migrate deploy` and waits for success.
6. Moves traffic to the latest revision only after migration succeeds.
7. Calls `/api` as a basic smoke test.

If the build or migration fails, the workflow stops and the previous production revision continues receiving traffic.

### 18. Commit and push the deployment files

At minimum, commit:

```text
Dockerfile
.dockerignore
.gitignore
.github/workflows/ci-cd.yml
docs/gcp-deployment.md
```

Then push a branch and open a pull request. The CI job should run. Merging to `main` triggers the production deployment.

## Part 4: Daily development workflow

### Change application code without a schema change

1. Create a branch.
2. Modify the code.
3. Run locally:

   ```powershell
   pnpm prisma:generate
   pnpm build
   ```

4. Push and open a pull request.
5. Merge after CI passes.

### Change the Prisma schema

Edit `prisma/schema.prisma`, then create the migration locally against the development database:

```powershell
pnpm exec prisma migrate dev --name describe_your_change
pnpm prisma:generate
pnpm build
```

Commit both:

```text
prisma/schema.prisma
prisma/migrations/<timestamp>_describe_your_change/migration.sql
```

After merging, GitHub Actions runs that committed migration against Cloud SQL before moving traffic.

Do not run these commands against production:

```text
prisma migrate dev
prisma db push
prisma migrate reset
```

Prefer backward-compatible migrations. For example, add a nullable column first, deploy code that populates it, and only make it required in a later deployment.

## Part 5: Use Prisma Studio with the cloud database

Do not publicly deploy Prisma Studio. Use the [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy) from your computer.

Start the proxy:

```powershell
cloud-sql-proxy.exe $InstanceConnectionName --port=5433
```

In another PowerShell window:

```powershell
$DbPassword = Read-Host "Cloud SQL database password"
$EncodedPassword = [uri]::EscapeDataString($DbPassword)
$env:DATABASE_URL = "postgresql://${DbUser}:${EncodedPassword}@127.0.0.1:5433/${DbName}"

pnpm prisma:studio
```

Studio will connect to Cloud SQL through the local authenticated proxy.

## Part 6: Existing local data

`prisma migrate deploy` creates the production schema but does not copy local records.

If local records matter:

1. Create a PostgreSQL dump with `pg_dump`.
2. Start the Cloud SQL Auth Proxy on port `5433`.
3. Restore the dump with `pg_restore` or `psql`.
4. Verify row counts before directing real traffic to the API.

Do not restore a dump blindly over a database that already contains production data.

## Part 7: Production safety checklist

Before accepting real users:

- Hash passwords with Argon2 or bcrypt. This repository currently stores passwords as plain text.
- Add authentication and authorization to the user endpoints.
- Restrict CORS to trusted frontend origins.
- Enable Cloud SQL automated backups and point-in-time recovery.
- Create a Google Cloud billing budget and alerts.
- Keep Cloud Run's maximum instance count low initially.
- Monitor Cloud Run errors and Cloud SQL connection counts.
- Do not print `DATABASE_URL`, passwords, or generated credentials in logs.
- Protect the GitHub `main` branch and require CI before merge.
- Protect the GitHub `production` environment if deployments need approval.

Cloud SQL supports scheduled and on-demand backups; see the [Cloud SQL backup overview](https://cloud.google.com/sql/docs/postgres/backup-recovery/backups). Billing budgets notify you about spending but do not automatically cap usage; see [Google Cloud budgets](https://cloud.google.com/billing/docs/how-to/budgets).

## Troubleshooting

### `bash: =: command not found` followed by `VALUE: Must be specified`

This means a PowerShell variable block was pasted into Git Bash. For example, this is valid PowerShell but invalid Bash:

```powershell
$ProjectId = "your-gcp-project-id"
```

Git Bash treats the separated `=` as a command. `$ProjectId` remains empty, so the later `gcloud config set project $ProjectId` command has no project value.

The failed commands did not create or change Google Cloud resources. Recover as follows:

1. From the existing `MINGW64` terminal, start PowerShell:

   ```bash
   powershell.exe -NoLogo
   ```

2. Confirm that the new prompt begins with `PS`:

   ```powershell
   $PSVersionTable.PSVersion
   ```

3. Re-run the entire PowerShell variable block from step 1.

4. Confirm the variable before calling `gcloud`:

   ```powershell
   $ProjectId
   ```

5. Set and verify the project:

   ```powershell
   gcloud config set project "$ProjectId"
   gcloud config get-value project
   ```

Both commands should show your real Google Cloud project ID. Continue to step 2 only after this works.

### `Can't reach database server at /cloudsql/...`

Check that:

- Cloud Run and Cloud SQL use the same project or have cross-project IAM configured.
- The runtime service account has `roles/cloudsql.client`.
- The service and migration job include the Cloud SQL connection.
- `DATABASE_URL` contains `?host=/cloudsql/PROJECT:REGION:INSTANCE`.
- The instance connection name is exact.

### `Permission iam.serviceAccounts.actAs denied`

The GitHub deployer cannot attach the runtime service account. Repeat:

```powershell
gcloud iam service-accounts add-iam-policy-binding $RuntimeServiceAccount --member="serviceAccount:$DeployServiceAccount" --role="roles/iam.serviceAccountUser"
```

### GitHub authentication fails immediately

Check:

- The workflow has `id-token: write`.
- `WIF_PROVIDER` is the full provider resource name, starting with `projects/PROJECT_NUMBER/`.
- `WIF_SERVICE_ACCOUNT` is the deployer email.
- The GitHub owner and repository names exactly match the provider condition.
- IAM changes have had several minutes to propagate.

### Source deployment cannot build

Verify that the build account has `roles/run.builder`:

```powershell
gcloud projects get-iam-policy $ProjectId --flatten="bindings[].members" --filter="bindings.members:$BuildServiceAccount" --format="table(bindings.role)"
```

### Prisma generation reports a missing `DATABASE_URL`

Prisma 7 loads `prisma.config.ts` while generating. The Dockerfile and CI job deliberately provide a placeholder PostgreSQL URL during generation. The build must never receive the production database password.

### Migration failed and the new revision has no traffic

That is the intended safe behavior. Inspect the job execution:

```powershell
gcloud run jobs executions list --job="$Service-migrate" --region=$Region
```

Fix the migration, create a new commit, and let the next workflow deploy a new revision. Do not force traffic to a revision whose migration failed.

## Cleanup

Cloud SQL incurs charges while the instance exists. To remove this tutorial's resources after experimentation:

```powershell
gcloud run jobs delete "$Service-migrate" --region=$Region
gcloud run services delete $Service --region=$Region
gcloud sql instances delete $SqlInstance
```

These commands permanently remove the deployed API and database. Export or back up valuable data first.
