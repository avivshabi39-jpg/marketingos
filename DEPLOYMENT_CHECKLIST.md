# MarketingOS — Deployment Checklist

## 1. Environment Variables

Set all of these in production before deploying:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Min 32-char random string for session signing |
| `ENCRYPTION_KEY` | ✅ | 32-char random string for AES-256-GCM field encryption |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Public base URL (e.g. `https://yourdomain.com`) |
| `RESEND_API_KEY` | ✅ | Resend API key for transactional email |
| `RESEND_FROM_EMAIL` | ✅ | Sender email address (e.g. `noreply@yourdomain.com`) |
| `ANTHROPIC_API_KEY` | ⚠️ | Required for AI features (agent, recommendations, reports, chatbot) |
| `CLOUDINARY_CLOUD_NAME` | ⚠️ | Required for image uploads |
| `CLOUDINARY_API_KEY` | ⚠️ | Required for image uploads |
| `CLOUDINARY_API_SECRET` | ⚠️ | Required for image uploads |
| `SUPERADMIN_EMAIL` | ⚠️ | Email address that gets super-admin role |
| `STRIPE_SECRET_KEY` | ⚠️ | Required for billing (sk_live_... in production) |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ | Required for Stripe webhook verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ⚠️ | Required for Stripe.js on client |
| `STRIPE_PRICE_ID_PRO` | ⚠️ | Stripe Price ID for PRO plan |
| `STRIPE_PRICE_ID_AGENCY` | ⚠️ | Stripe Price ID for AGENCY plan |
| `CRON_SECRET` | ⚠️ | Random secret for securing cron endpoints |
| `REFRESH_TOKEN_SECRET` | ✅ | Min 32-char secret for refresh token signing |
| `NEXT_PUBLIC_APP_DOMAIN` | ⚠️ | Root domain for subdomain URL generation |

## 2. Database Migration

```bash
# Push schema to production DB
npx prisma db push --schema=packages/db/prisma/schema.prisma

# Or use migrate deploy for production
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
```

## 3. Pre-Deploy Build Check

```bash
# From repo root
cd apps/web

# TypeScript — must return 0 errors
npx tsc --noEmit

# Build
npm run build
```

## 4. Security Checklist

- [ ] `ENCRYPTION_KEY` is unique and not shared with dev environment
- [ ] `JWT_SECRET` is unique and not shared with dev environment
- [ ] PostgreSQL is not publicly accessible (use connection pooling via PgBouncer or Supabase)
- [ ] All API routes with mutations are authenticated
- [ ] `security.txt` accessible at `/.well-known/security.txt`
- [ ] HTTPS enforced — HSTS header is set (`max-age=63072000`)
- [ ] CSP headers are configured in `next.config.js`
- [ ] Rate limiting is active on public API routes (`/api/leads`, `/api/intake/*`)
- [ ] Honeypot `_hp` field on all public forms

## 5. Cron Jobs

Configure these to be called on schedule (Vercel Cron, Railway, cron-job.org):

| Endpoint | Schedule | Auth Header |
|---|---|---|
| `POST /api/cron/reports` | `0 8 * * 1` | `x-cron-secret: $CRON_SECRET` |
| `POST /api/cron/followups` | `0 * * * *` | `x-cron-secret: $CRON_SECRET` |
| `POST /api/cron/ai-suggestions` | `0 6 * * *` | `x-cron-secret: $CRON_SECRET` |
| `POST /api/cron/email-sequences` | `*/15 * * * *` | `x-cron-secret: $CRON_SECRET` |

## 6. Stripe Setup

1. Create products + prices in Stripe dashboard (PRO: ₪299/mo, AGENCY: ₪799/mo)
2. Copy price IDs → `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_AGENCY`
3. Configure webhook: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Enable Stripe Customer Portal in Stripe settings
5. Test in test mode before switching to `sk_live_`

## 7. Functionality Smoke Test

After deploying, verify:

- [ ] `/admin/login` — login works
- [ ] `/admin/dashboard` — loads without error
- [ ] `/admin/clients` — client list loads
- [ ] Create a new client with slug `test-client`
- [ ] `/{slug}/intake` — intake form loads and submits
- [ ] Submit intake form → lead appears in `/admin/leads`
- [ ] `/admin/leads` — kanban and list views work
- [ ] `/admin/appointments` — page loads
- [ ] `/admin/broadcast` — WhatsApp broadcast wizard loads
- [ ] `/admin/system` — health check shows all green
- [ ] `/admin/reports` — PDF download works
- [ ] `/admin/billing` — plan comparison + upgrade/cancel flow
- [ ] `/admin/email-sequences` — create sequence, add steps
- [ ] `/admin/clients/[id]/chatbot` — chatbot settings save
- [ ] `/admin/clients/[id]/whitelabel` — brand settings save
- [ ] `/admin/system-report` — system dashboard (SUPER_ADMIN only)
- [ ] Delete `test-client` after testing

## 8. Green API Setup (WhatsApp)

1. Go to [app.green-api.com](https://app.green-api.com) and create an instance
2. Scan QR code to connect WhatsApp account
3. Copy Instance ID and API Token
4. In client settings: paste Instance ID and API Token
5. Enable "Auto-reply" toggle to activate lead confirmations

## 9. DNS & Domain

- [ ] A record points to your server IP
- [ ] SSL certificate is valid
- [ ] `www` redirects to apex domain (or vice versa)
- [ ] `robots.txt` is accessible (check if you want public pages indexed)

## 10. Performance

- [ ] Images served from Cloudinary with CDN
- [ ] Next.js standalone output enabled (`output: "standalone"` in `next.config.js`)
- [ ] Database connection pooling configured
- [ ] Prisma client generated for correct platform (linux-musl-openssl-3.0.x for Docker)

## 11. Backup

- [ ] Daily automated PostgreSQL backups configured
- [ ] Backup restore procedure tested
- [ ] Environment variables backed up securely (not in git)

## 12. Post-Deploy Monitoring

- [ ] Error tracking (Sentry or similar) connected
- [ ] Server resource monitoring (CPU, RAM, disk)
- [ ] Database connection count monitored
- [ ] Check `/admin/system` regularly for integration health

---

**Build date:** Generated by MarketingOS pre-launch verification
