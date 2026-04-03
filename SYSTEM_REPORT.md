# System Report — Marketing System

> Updated: 2026-03-30 — Final Pre-Launch Build

---

## Architecture

**Monorepo** (Turborepo) with:
- `apps/web` — Next.js 15 App Router (admin panel + client portal + public pages)
- `packages/db` — Prisma schema + generated client

**Multi-tenancy**: Each `Client` record has an `ownerId` linking to a `User`. All API routes enforce ownership via `ownerId` checks.

---

## DB Models (36)

| Model | Description |
|---|---|
| Client | Core business client entity (+ chatbot, white-label fields) |
| User | Admin users (ADMIN / SUPER_ADMIN) |
| Lead | CRM leads with status pipeline |
| Appointment | Lead appointments |
| IntakeForm | Dynamic intake forms per client |
| LandingPage | Drag & drop pages (blocks JSON) |
| Report | Weekly/monthly performance reports |
| Automation | Trigger/action automation rules |
| Template | WhatsApp message templates |
| EmailTemplate | Email templates |
| AuditLog | Security audit trail |
| RefreshToken | JWT refresh tokens for revocation |
| AiConversation | AI agent conversation history |
| AiUsage | AI token usage per client |
| BroadcastLog | WhatsApp broadcast campaigns |
| InboxEvent | Unified inbox events |
| PageView | Landing page view tracking |
| Subscription | Stripe subscriptions (cancelAtPeriodEnd) |
| Property | Real estate listings |
| Office | Real estate office branches |
| PropertyLead | Property inquiry leads |
| PropertyAlert | Buyer preference alerts |
| LeadForm | Lead capture forms on pages |
| SocialPost | AI-generated social media posts |
| AbTestEvent | A/B testing events |
| MessageTemplate | WhatsApp template library |
| SystemSettings | Global system configuration |
| CampaignImage | AI-generated campaign images |
| AiSuggestion | AI recommendations per client |
| WebhookLog | n8n webhook delivery log |
| LeadActivity | Lead timeline activity entries |
| PasswordResetToken | Password reset tokens |
| TwoFactorSecret | TOTP 2FA secrets |
| EmailSequence | Email automation sequences with steps |
| EmailSequenceLog | Per-lead delivery log for sequences |

---

## Features

| Feature | Status |
|---|---|
| Lead CRM | ✅ Full CRUD, status pipeline, activities, CSV export |
| AI Agent (streaming SSE) | ✅ claude-haiku, BUILD_PAGE / UPDATE_COLOR / PUBLISH actions |
| AI Performance Recommendations | ✅ Cached 1hr, perf metrics + Claude analysis |
| Inbox (WhatsApp Reply) | ✅ Inline reply panel, AI suggestion, Green API send |
| Landing Page Builder | ✅ @dnd-kit drag&drop, 12+ block types, A/B testing, drag from library |
| WhatsApp (Green API) | ✅ Individual + broadcast, encrypted tokens |
| Performance Reports | ✅ Weekly/monthly, PDF, AI summary, SVG bezier line chart |
| Intake Forms | ✅ Dynamic fields, n8n webhook trigger |
| Automations | ✅ Trigger/action rules, follow-up scheduler |
| Snapshots (Industry Templates) | ✅ Roofing, Cosmetics, Cleaning, Real Estate — preview + apply |
| Real Estate Module | ✅ Properties, offices, alerts, buyer broadcast |
| Billing (Stripe) | ✅ Checkout, portal, cancel, webhook, trial period, plan comparison |
| Client Portal | ✅ Slug-based, leads, reports, AI tools, performance |
| Social Posts AI | ✅ AI content + image generation |
| 2FA (TOTP) | ✅ Super admin TOTP, UI at /settings/security |
| Leads SVG Chart | ✅ Bezier curve, dots, tooltip, area fill |
| System Report | ✅ /admin/system-report live dashboard |
| AI Chatbot 24/7 | ✅ Per-client settings, FAQ, schedule, ChatbotWidget embed |
| White-label | ✅ Per-client brand, colors, domain, portal integration |
| Email Sequences | ✅ Visual step builder, triggers, cron delivery, logs |
| Auto Subdomain | ✅ lib/getClientUrl.ts — prod/preview/local URL resolution |
| Google Ads | ✅ Skeleton page + coming-soon UI per client |
| Facebook Ads | ✅ Skeleton page + coming-soon UI |
| Voice Drops | ✅ Skeleton page + coming-soon UI |
| PWA | ✅ manifest.json, PWAInstallPrompt component |
| Notification Center | ✅ NotificationBell with live count in admin header |
| Quick Actions | ✅ QuickActions panel on dashboard |

---

## Security Layers (14)

1. **JWT Access Token** — HS256, 1hr, httpOnly cookie
2. **JWT Refresh Token** — HS256, 30d, DB-persisted, revocable
3. **Rate Limiting** — in-memory per IP+endpoint, 429 + Retry-After
4. **Brute Force Protection** — 5 attempts → 15min lock (by email + IP)
5. **Multi-tenant Isolation** — ownerId checked on every API route
6. **Input Validation (Zod)** — all POST/PATCH routes validated
7. **AES-256-GCM Encryption** — Green API tokens encrypted in DB
8. **Audit Logging** — login, password reset, client/lead events
9. **Session Revocation** — password reset deletes all RefreshTokens
10. **CSRF Protection** — SameSite=Lax + Next.js built-in
11. **Secure Cookies** — httpOnly, secure (production), SameSite=lax
12. **SQL Injection Prevention** — Prisma ORM only (parameterized)
13. **XSS Prevention** — React JSX auto-escaping throughout
14. **Timing Attack Prevention** — bcrypt always runs even for missing users

---

## Integrations

| Service | ENV Variable | Usage |
|---|---|---|
| Anthropic Claude | ANTHROPIC_API_KEY | AI agent, recommendations, posts, reports |
| Green API (WhatsApp) | Per-client DB (encrypted) | Send messages, broadcast, follow-ups |
| Stripe | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET | Billing, subscriptions |
| n8n | Per-client DB (n8nWebhookUrl) | Automation webhooks |
| Cloudinary | CLOUDINARY_URL | Image uploads |
| Resend | RESEND_API_KEY | Email — reports + password reset |

---

## API Route Categories

| Category | Count | Key Routes |
|---|---|---|
| Auth | 6 | login, logout, register, refresh, forgot-password, reset-password |
| AI | 14 | agent/stream, reply-suggestion, landing-page, social-post, whatsapp-message, ... |
| Clients | 7 | CRUD, builder, analytics, performance, ai-recommendations |
| Leads | 6 | CRUD, activities, note, export, stats |
| Reports | 4 | generate, PDF, send, leads-chart |
| Inbox | 2 | list/mark-read, reply (WhatsApp) |
| Billing | 5 | checkout, portal, cancel, health, stripe-webhook |
| Real Estate | 8 | properties, offices, property-alerts, broadcast |
| Misc | 10+ | broadcast, intake, snapshots, upload, search, health, track, audit-logs |

---

## Cron Jobs

| Job | Schedule | Purpose |
|---|---|---|
| `/api/cron/reports` | Weekly/Monthly | Auto-generate performance reports |
| `/api/cron/followups` | Hourly | Send WhatsApp follow-up messages |
| `/api/cron/ai-suggestions` | Daily | Generate AI suggestions per client |
| `/api/cron/email-sequences` | Every 15 min | Process email sequence step delivery |

---

*Live dashboard available at `/admin/system-report` (SUPER_ADMIN only)*
