# Easy Meal Deployment Guide

This guide covers deploying Easy Meal to Google Cloud Platform using Cloud Run and Cloud SQL.

## Prerequisites

1. Google Cloud account with billing enabled
2. `gcloud` CLI installed and authenticated
3. Docker installed locally (for testing builds)

## Initial Setup

### 1. Create GCP Project

```bash
# Create project
gcloud projects create easy-meal-prod --name="Easy Meal Production"

# Set as active project
gcloud config set project easy-meal-prod

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com
```

### 2. Set Up Cloud SQL (PostgreSQL)

```bash
# Create Cloud SQL instance
gcloud sql instances create easy-meal-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-size=10GB \
  --storage-auto-increase

# Create database
gcloud sql databases create easymeal --instance=easy-meal-db

# Create user
gcloud sql users create easymeal \
  --instance=easy-meal-db \
  --password=<SECURE_PASSWORD>
```

### 3. Configure Secrets

```bash
# Create secrets in Secret Manager
echo -n "postgresql://easymeal:<PASSWORD>@/<DATABASE>?host=/cloudsql/<CONNECTION_NAME>" | \
  gcloud secrets create easy-meal-db-url --data-file=-

echo -n "<BETTER_AUTH_SECRET>" | \
  gcloud secrets create easy-meal-auth-secret --data-file=-

echo -n "<GOOGLE_AI_API_KEY>" | \
  gcloud secrets create easy-meal-ai-key --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding easy-meal-db-url \
  --member="serviceAccount:<PROJECT_NUMBER>-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4. Run Database Migrations

Before first deployment, run migrations:

```bash
# Connect to Cloud SQL via proxy
gcloud sql connect easy-meal-db --user=easymeal

# Or use Cloud SQL Auth Proxy locally
./cloud-sql-proxy easy-meal-prod:us-central1:easy-meal-db &

# Then run migrations
cd packages/api
DATABASE_URL="postgresql://easymeal:<PASSWORD>@localhost:5432/easymeal" bun run db:push
```

## Deployment

### Automatic Deployment (Cloud Build)

Set up a Cloud Build trigger:

```bash
# Connect to GitHub
gcloud builds triggers create github \
  --repo-name=easy-meal \
  --repo-owner=<GITHUB_USERNAME> \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

Then push to main branch to trigger deployment.

### Manual Deployment

```bash
# Build and push API
docker build -t gcr.io/easy-meal-prod/easy-meal-api:latest -f packages/api/Dockerfile .
docker push gcr.io/easy-meal-prod/easy-meal-api:latest

# Deploy API
gcloud run deploy easy-meal-api \
  --image gcr.io/easy-meal-prod/easy-meal-api:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="DATABASE_URL=easy-meal-db-url:latest,GOOGLE_AI_API_KEY=easy-meal-ai-key:latest,BETTER_AUTH_SECRET=easy-meal-auth-secret:latest" \
  --set-env-vars="NODE_ENV=production,FRONTEND_URL=https://easy-meal-web-xxx.run.app"

# Build and push Web
docker build -t gcr.io/easy-meal-prod/easy-meal-web:latest \
  --build-arg VITE_API_URL=https://easy-meal-api-xxx.run.app \
  -f packages/web/Dockerfile .
docker push gcr.io/easy-meal-prod/easy-meal-web:latest

# Deploy Web
gcloud run deploy easy-meal-web \
  --image gcr.io/easy-meal-prod/easy-meal-web:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

## Environment Variables

### API Service

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (from Secret Manager) |
| `BETTER_AUTH_SECRET` | Secret key for session signing |
| `BETTER_AUTH_URL` | Public URL of the API service |
| `FRONTEND_URL` | Public URL of the web service (for CORS) |
| `GOOGLE_AI_API_KEY` | Gemini API key for recipe generation |
| `NODE_ENV` | Set to `production` |
| `SENTRY_DSN` | (Optional) Sentry DSN for error tracking |

### Web Service

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Public URL of the API service |

## Custom Domain (Optional)

```bash
# Map custom domain to web service
gcloud run domain-mappings create --service easy-meal-web --domain app.easymeal.com --region us-central1

# Map custom domain to API service
gcloud run domain-mappings create --service easy-meal-api --domain api.easymeal.com --region us-central1
```

## Monitoring

### View Logs

```bash
# API logs
gcloud run services logs read easy-meal-api --region us-central1

# Web logs
gcloud run services logs read easy-meal-web --region us-central1
```

### Health Checks

- API: `https://easy-meal-api-xxx.run.app/health`
- Web: `https://easy-meal-web-xxx.run.app/`

## Cost Optimization

- Cloud Run scales to zero when not in use
- Cloud SQL uses smallest tier (db-f1-micro)
- Consider using Cloud SQL IAM authentication instead of password

## Rollback

```bash
# List revisions
gcloud run revisions list --service easy-meal-api --region us-central1

# Route traffic to previous revision
gcloud run services update-traffic easy-meal-api \
  --to-revisions=easy-meal-api-00001-abc=100 \
  --region us-central1
```
