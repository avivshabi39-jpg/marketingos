# MarketingOS — Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm 9+

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp apps/web/.env.local.example apps/web/.env.local
# Edit apps/web/.env.local (see variables below)

# 3. Push schema to DB
cd packages/db
npx prisma db push
npx prisma db seed       # creates admin@marketingos.local / admin123

# 4. Start dev server
cd ../..
npm run dev              # → http://localhost:3000
```

---

## Environment Variables

All variables go in `apps/web/.env.local`.

### Required

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/marketing_db` |
| `JWT_SECRET` | Secret for signing admin JWTs — use a long random string | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the app — used in QR codes and password-reset emails | `http://localhost:3000` |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM field encryption — **required** | See below |

#### Generating the ENCRYPTION_KEY

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add it to `.env.local`:
```
ENCRYPTION_KEY=<64-hex-char output>
```

> **Important:** Store this key securely. Losing it means losing access to all encrypted data (Facebook tokens, webhook URLs, API keys). Back it up to a secrets manager (AWS Secrets Manager, 1Password, etc.).

### Email (Resend) — needed for password reset + report sending

| Variable | Where to get | Example |
|---|---|---|
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) | `re_xxxxxxxxxxxxxxxx` |
| `RESEND_FROM` | Verified sender address in Resend | `MarketingOS <noreply@yourdomain.com>` |
| `FROM_EMAIL` | Same domain as above | `noreply@yourdomain.com` |

> **Without Resend:** the app still works fully — forgot-password and report emails are silently skipped.

### Cron Jobs

| Variable | Description |
|---|---|
| `CRON_SECRET` | Protects `POST /api/cron/reports` — any random string |

Call the cron endpoint daily:
```
POST https://yourapp.com/api/cron/reports
Authorization: Bearer <CRON_SECRET>
```

### Facebook Lead Ads (optional)

| Variable | Where to get |
|---|---|
| `FACEBOOK_ACCESS_TOKEN` | Meta Business Suite → System User token |
| `FACEBOOK_VERIFY_TOKEN` | Any string — set the same in Meta webhook settings |

Webhook URL to register in Meta: `https://yourapp.com/api/webhooks/facebook`

---

## Adding Your First Client (3 steps)

1. **Log in** → `http://localhost:3000/admin/login`
   - Email: `admin@marketingos.local`
   - Password: `admin123`

2. **Create a client** → `/admin/clients/new`
   - Fill name, slug (e.g. `roofing-co`), industry, primary color
   - Set a **portal password** so the client can log in at `/client/roofing-co`

3. **Share the lead capture form**
   - Go to `/admin/intake-forms`
   - Copy the link or QR code for the client's form
   - Share the URL: `https://yourapp.com/roofing-co/intake`

Leads submitted via the form appear instantly in `/admin/leads`.

---

## Connecting n8n (Basic)

n8n lets you automate actions when a new lead comes in (send WhatsApp, update CRM, etc.).

1. **In n8n** — create a Webhook node, copy its URL (e.g. `https://n8n.yourdomain.com/webhook/abc123`)
2. **In MarketingOS** → Settings → Integrations → paste the URL under "n8n Webhook ברירת מחדל"
3. Click **בדוק חיבור** to verify
4. **Per-client webhooks** — go to a client's page → Workflows → Add webhook with the same or a different n8n URL

The webhook payload sent on every new lead:
```json
{
  "event": "lead.created",
  "lead": {
    "id": "...",
    "name": "ישראל ישראלי",
    "email": "israel@example.com",
    "phone": "050-0000000",
    "source": "facebook",
    "utmSource": "fb_campaign_1",
    "utmCampaign": "summer_promo"
  }
}
```

---

## Admin Credentials (after seed)

| Field | Value |
|---|---|
| URL | `http://localhost:3000/admin/login` |
| Email | `admin@marketingos.local` |
| Password | `admin123` |
| Role | SUPER_ADMIN |

> Change the password immediately after first login via Settings → Users.
