# n8n on Railway — Deploy Guide

## Prerequisites
- Railway account (railway.app)
- MarketingOS running on Vercel

## Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project** -> **Deploy from GitHub repo**
   - OR click **New Project** -> **Empty Project**
3. If using empty project: click **New Service** -> **Docker Image** -> enter `n8nio/n8n:latest`

## Step 2: Add PostgreSQL Database

1. In your Railway project, click **New Service** -> **Database** -> **PostgreSQL**
2. Railway auto-provisions the DB and sets connection vars
3. Copy the following from the PostgreSQL service **Variables** tab:
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

## Step 3: Set Environment Variables

In the n8n service, go to **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `N8N_HOST` | `0.0.0.0` |
| `N8N_PORT` | `5678` |
| `N8N_PROTOCOL` | `https` |
| `WEBHOOK_URL` | `https://<your-railway-url>` (set after first deploy) |
| `N8N_BASIC_AUTH_ACTIVE` | `true` |
| `N8N_BASIC_AUTH_USER` | `admin` |
| `N8N_BASIC_AUTH_PASSWORD` | (choose a strong password) |
| `N8N_ENCRYPTION_KEY` | (generate: `openssl rand -hex 16`) |
| `DB_TYPE` | `postgresdb` |
| `DB_POSTGRESDB_HOST` | (from PostgreSQL service) |
| `DB_POSTGRESDB_PORT` | `5432` |
| `DB_POSTGRESDB_DATABASE` | (from PostgreSQL service) |
| `DB_POSTGRESDB_USER` | (from PostgreSQL service) |
| `DB_POSTGRESDB_PASSWORD` | (from PostgreSQL service) |
| `EXECUTIONS_PROCESS` | `main` |
| `EXECUTIONS_DATA_PRUNE` | `true` |
| `EXECUTIONS_DATA_MAX_AGE` | `168` |

## Step 4: Deploy and Get URL

1. Railway auto-deploys after setting variables
2. Go to **Settings** -> **Networking** -> **Generate Domain**
3. Copy the public URL (e.g. `https://n8n-production-xxxx.up.railway.app`)
4. Go back to **Variables** and set `WEBHOOK_URL` to this URL
5. Redeploy for the change to take effect

## Step 5: Connect to MarketingOS

Add to Vercel environment variables:

```
N8N_WEBHOOK_URL=https://n8n-production-xxxx.up.railway.app
```

Or set per-client in MarketingOS admin: Client -> Settings -> n8n Webhook URL

## Step 6: Verify

1. Open `https://<your-railway-url>/healthz` -> should return `{ "status": "ok" }`
2. Log in with the basic auth credentials you set
3. Create your first workflow with a Webhook trigger
4. Test by sending a request from MarketingOS

## Costs

- Railway Starter: $5/month credit (free)
- PostgreSQL: included in credit
- n8n: ~$3-5/month for light usage
- Total: free under starter plan for most use cases

## Troubleshooting

- **502 error**: Check Railway logs, ensure `N8N_PORT=5678` and `N8N_HOST=0.0.0.0`
- **Webhook not receiving**: Verify `WEBHOOK_URL` matches the Railway public domain
- **DB connection error**: Check PostgreSQL credentials match exactly
- **Auth loop**: Clear browser cookies, verify `N8N_BASIC_AUTH_PASSWORD` is correct
