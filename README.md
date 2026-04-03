# MarketingOS

פלטפורמת SaaS לניהול שיווק ולידים לסוכנויות ועסקים ישראלים.
Israeli SaaS marketing platform for agencies and businesses.

---

## Features

- **ניהול לידים** — Kanban, bulk actions, lead scoring, export CSV
- **בונה דפי נחיתה** — Drag & drop, 9 block types, A/B testing, AI generation
- **AI Agent** — Claude-powered page builder, social posts, content generation
- **פורטל לקוח** — Self-service dashboard with stats, share center, checklist
- **דוחות** — Weekly/monthly reports with PDF export
- **אוטומציות** — WhatsApp auto-reply, email sequences, cron jobs
- **אבטחה** — JWT + refresh tokens, rate limiting, AES-256 encryption, XSS protection

---

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm 10+

### Setup

```bash
git clone <repo>
cd marketing-system

# Install dependencies
npm install

# Configure environment
cp apps/web/.env.production.example apps/web/.env.local
# Edit .env.local with your values (at minimum: DATABASE_URL, JWT_SECRET)

# Push database schema
cd packages/db && npx prisma db push && cd ../..

# Seed admin user
cd packages/db && npx prisma db seed && cd ../..

# Start dev server
npm run dev
```

Open http://localhost:3000/admin/login
Default: `admin@marketingos.local` / `admin123`

---

## Environment Variables

See `apps/web/.env.production.example` for full documentation.

**Required to start:**
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token signing (generate: `openssl rand -hex 32`) |
| `JWT_REFRESH_SECRET` | Refresh token signing |
| `ENCRYPTION_KEY` | AES-256 field encryption |
| `NEXT_PUBLIC_APP_URL` | Your domain |

**Required for features:**
| Variable | Feature | Provider |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | AI agent, content generation | console.anthropic.com |
| `RESEND_API_KEY` | Email reports, sequences | resend.com |
| `STRIPE_SECRET_KEY` | Billing & subscriptions | dashboard.stripe.com |
| `CLOUDINARY_CLOUD_NAME` | Image/logo uploads | cloudinary.com |

---

## Deploy to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd marketing-system
vercel --prod

# Set environment variables in Vercel dashboard:
# Settings → Environment Variables → add all from .env.production.example
```

### Post-deploy checklist
- [ ] Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
- [ ] Generate and set `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`
- [ ] Set `DATABASE_URL` to production Postgres (Neon recommended)
- [ ] Set `ANTHROPIC_API_KEY` for AI features
- [ ] Set `RESEND_API_KEY` for email
- [ ] Configure Stripe for billing (optional)
- [ ] Run: `npx prisma db push` against production DB

---

## First Client Setup

1. Login at `/admin/login`
2. Click **"לקוח חדש"** → fill in business details
3. Open client → **"בונה דפי נחיתה"** → use AI to generate page
4. Click **"פרסם"** → landing page goes live at `yourdomain.com/slug`
5. Share the landing page URL with the client
6. Leads start flowing into the Kanban board
7. Client can login at `/client/slug` with password `portal123`

---

## Architecture

```
marketing-system/
├── apps/
│   └── web/                    # Next.js 14 App Router
│       ├── app/
│       │   ├── admin/          # Admin dashboard
│       │   ├── client/         # Client portal
│       │   ├── api/            # 108 API routes
│       │   └── [slug]/         # Public landing pages
│       ├── components/
│       ├── lib/                # Auth, AI, WhatsApp, encryption
│       └── __tests__/          # 28 automated tests
└── packages/
    └── db/
        └── prisma/
            └── schema.prisma   # 36+ models
```

### Tech Stack
- **Framework**: Next.js 14 (App Router, Server Components)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + refresh tokens (jose), bcrypt
- **AI**: Anthropic Claude (Haiku) via direct API
- **UI**: Tailwind CSS + lucide-react, RTL Hebrew
- **Email**: Resend
- **Payments**: Stripe
- **Images**: Cloudinary
- **WhatsApp**: Green API

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
cd apps/web && npm test   # Run 28 automated tests (Vitest)
cd packages/db && npx prisma studio   # Database GUI
```

---

## License

Private — all rights reserved.
