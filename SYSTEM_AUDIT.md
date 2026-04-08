# MarketingOS - Deep System Validation & Bug Detection Audit

*Generated: April 8, 2026*

---

## 1. Executive Summary

This audit examined the MarketingOS codebase across 150+ API routes, 35 Prisma models, 84+ pages, and all automation flows. The platform is feature-rich and architecturally sound in its core patterns, but has **several critical issues that must be fixed before launch**.

**Findings by severity:**
- **CRITICAL:** 8 issues (data leakage, silent failures, missing security checks)
- **HIGH:** 9 issues (validation gaps, race conditions, blocking operations)
- **MEDIUM:** 7 issues (UX confusion, schema gaps, scaling limits)
- **LOW:** 4 issues (minor optimizations, documentation)

**Top 3 launch blockers:**
1. Missing tenant ownership checks on 3+ API routes allow cross-tenant data access
2. Email sequences are marked "sent" without actually sending emails
3. Cron endpoints run unprotected if `CRON_SECRET` env var is missing

---

## 2. Core Flow Audit

### Main Business Flow: Landing Page → Lead → CRM → Follow-up

| Step | Status | Details |
|------|--------|---------|
| Landing page is created | ✅ Working | AI questionnaire (13 steps) + block renderer + A/B testing all functional |
| Form loads correctly | ✅ Working | FormBlock renders with custom fields, honeypot protection present |
| Lead submits successfully | ⚠️ Risk | Works but race condition: two concurrent submissions with same phone can bypass duplicate detection (non-atomic check-then-create) |
| Lead is saved in DB | ✅ Working | Zod validation, auto-scoring, UTM capture all present |
| Lead appears in CRM instantly | ✅ Working | Real-time via API fetch, notification created, InboxEvent created |
| WhatsApp auto-message is sent | ⚠️ Risk | Fire-and-forget with `.catch(() => {})` — failures are completely silent. No retry, no logging, no notification if Green API is down |
| Follow-up can happen | ⚠️ Risk | WhatsApp drip cron has bugs: status updated even if send fails; bare catch blocks hide failures |
| Client sees the lead correctly | ✅ Working | Portal dashboard fetches leads scoped to client slug |
| Admin sees lead in correct context | ✅ Working | Proper multi-tenant scoping in `/api/leads` with ownerId checks |

### Intake Form Flow

| Step | Status | Details |
|------|--------|---------|
| Form renders | ✅ Working | 12-step progressive form with validation |
| Form submits | ⚠️ Risk | No duplicate detection (unlike `/api/leads`). Same person can submit 10x → 10 leads + 10 auto-replies |
| Lead + IntakeForm created | ✅ Working | Both records created in same request |
| Client notified | ⚠️ Risk | Same silent failure pattern as lead creation |

### Email Sequence Flow

| Step | Status | Details |
|------|--------|---------|
| Sequence created | ✅ Working | Trigger types, step builder, delays all functional |
| Cron triggers execution | ⚠️ Risk | Runs unprotected if CRON_SECRET env var is missing |
| Email actually sent | ❌ Broken | **Emails are NOT sent.** Code creates `EmailSequenceLog` with status "sent" but never calls Resend API. Comment says "actual Resend sending is a future integration" |
| Lead receives email | ❌ Broken | No email is delivered |

### Broadcast Flow

| Step | Status | Details |
|------|--------|---------|
| Audience selected | ✅ Working | 3 filters (all, new, contacted) with count preview |
| Message composed | ✅ Working | Templates, AI generation, character counter |
| Broadcast sent | ⚠️ Risk | Rate limiting is IP-based only, not per-client. No protection against concurrent duplicate broadcasts |
| Recipients receive message | ⚠️ Risk | Depends on Green API availability with no fallback |

### Report Flow

| Step | Status | Details |
|------|--------|---------|
| Cron generates report | ⚠️ Risk | No transaction — stale data if leads change during aggregation. Cron secret validation vulnerable |
| Report saved to DB | ✅ Working | Report model populated correctly |
| Email sent to client | ✅ Working | Resend integration functional for reports (unlike sequences) |
| Client views in portal | ✅ Working | Reports page renders correctly |

---

## 3. Multi-Tenant / Security Risks

### CRITICAL: Missing Ownership Verification

**Issue 1: `/api/properties/[id]` — No ownership check on GET/PATCH**
- File: `apps/web/app/api/properties/[id]/route.ts` lines 46-84
- Any logged-in admin can read/modify ANY property from ANY client
- Only checks `session.clientId` (for scoped agents) but regular admins bypass entirely
- **Impact:** Cross-tenant data access and modification

**Issue 2: `/api/clients/[id]/notifications` — No ownership check**
- File: `apps/web/app/api/clients/[id]/notifications/route.ts` lines 6-42
- GET and PATCH accept `params.id` without verifying the caller owns that client
- Any admin can read and dismiss notifications for any other company's clients
- **Impact:** Cross-tenant notification leakage

**Issue 3: `/api/appointments` — Incomplete ownership check on POST**
- File: `apps/web/app/api/appointments/route.ts` lines 79-131
- Creates appointment with provided `clientId` without verifying ownership
- Only validates the clientId exists, not that the caller owns it
- **Impact:** Users can create appointments for clients they don't own

### HIGH: Cron Endpoints Unprotected When Env Var Missing

**Affected files:**
- `apps/web/app/api/cron/email-sequences/route.ts` line 11
- `apps/web/app/api/cron/reports/route.ts` line 205
- `apps/web/app/api/cron/followups/route.ts` line 13

**Pattern:** `if (cronSecret) { validate... }` — if `CRON_SECRET` is undefined, the `if` block is skipped entirely and the endpoint executes without any auth.

**Contrast:** `whatsapp-drip/route.ts` line 7 correctly returns 401 if secret is missing.

### MEDIUM: Client Portal Token Issues

- File: `apps/web/lib/clientAuth.ts` lines 15-27
- `getClientSession()` validates JWT signature but does NOT verify the client still exists or is active
- A deleted/deactivated client can access data until token expires (7 days)
- Client auth is a simple password hash on the Client model (not a separate User record) — no audit trail for client sessions, no client-level 2FA

### MEDIUM: JWT Secret Defaults

- Files: `lib/auth.ts` line 5, `lib/clientAuth.ts` line 4, `client-auth/login/route.ts` line 9
- Default secret: `"dev-secret-change-in-production"`
- If env vars aren't set, entire auth system uses known hardcoded secret

### Positive Findings

- ✅ `/api/leads/route.ts` has proper multi-tenant scoping (lines 66-96) for all user types
- ✅ Email templates verify ownership via `assertOwner()` helper
- ✅ Properties broadcast route properly checks ownership
- ✅ Admin layout requires authentication
- ✅ Bcrypt used for password hashing
- ✅ Input sanitization on lead creation
- ✅ Audit logging tracks admin actions with IP and user agent

---

## 4. Dashboard Problems

### Duplicated Features Between Admin and Client Portal

| Feature | Admin | Client Portal | Risk |
|---------|-------|---------------|------|
| AI Agent | Multi-client, 7 categories | Single-client "Michael" persona | Same API, different UX — confusing for users who see both |
| AI Designer | `/admin/ai-designer` | `/client/[slug]/ai-designer` | Identical functionality, duplicated code |
| Broadcasts | `/admin/broadcast` | `/client/[slug]/broadcast` | Same API, different scope |
| Social Posts | `/admin/social-posts` | `/client/[slug]/social` | Same feature |
| Analytics | Cross-client | Single-client | Same data source |
| Page Builder | Admin has 3 entry points | Client has 2 entry points | **5 total ways to build a page** — extremely confusing |
| Appointments | `/admin/appointments` | `/client/[slug]/appointments` | Same API |
| Properties | `/admin/properties` | `/client/[slug]/properties` | Same CRUD |
| Emails | `/admin/email` | `/client/[slug]/email` | Same feature |

### Navigation Overload

**Client Portal has 17 sidebar items** — too many for business owners:
Dashboard, Leads, Properties, Reports, Analytics, SEO, Appointments, Broadcast, Posts, AI Designer, Build Page, Edit Page, Emails, Automations, My Agent, Help, Settings

**Recommendation:** Reduce to 9 primary items with progressive disclosure.

### Page Builder Confusion

There are **5 different entry points** to build/edit a landing page:
1. `/admin/clients/[id]/builder` — Admin builder with AI questionnaire
2. `/admin/clients/[id]/builder/wizard` — Admin guided wizard
3. `/admin/page-builder/[clientId]` — Admin RE page builder
4. `/client/[slug]/build-page` — Client builder
5. `/client/[slug]/edit-page` — Client editor

Users don't know which to use. "Build Page" vs "Edit Page" as separate menu items is confusing — they should be unified.

### Missing System Status Indicators

- No visible indicator in admin dashboard when Green API (WhatsApp) is disconnected
- No alert when cron jobs fail
- No notification when Stripe webhook fails
- AI usage quota shown only on dedicated page, not in dashboard

---

## 5. AI Agent Risks

### What the AI Agent Can Actually Do

The AI agent at `/api/ai/agent/stream` can execute these **real database actions** (lines 248-344):

| Action | What It Does | Risk Level |
|--------|-------------|------------|
| `BUILD_PAGE` | Overwrites `Client.pageBlocks` with AI-generated blocks | HIGH — overwrites without backup |
| `UPDATE_HERO` | Updates hero block in pageBlocks | MEDIUM |
| `UPDATE_COLOR` | Changes `Client.primaryColor` | LOW |
| `ADD_BLOCK` | Appends block to pageBlocks array | MEDIUM |
| `CHANGE_CTA` | Updates CTA text in blocks | LOW |
| `UPDATE_FEATURES` | Updates features block | MEDIUM |
| `PUBLISH` | Sets `Client.pagePublished = true` | HIGH — makes page live |
| `ADD_LEAD` | Creates Lead record directly | HIGH — bypasses duplicate detection |
| `CREATE_BROADCAST` | Creates BroadcastLog | HIGH — could spam leads |
| `CREATE_SOCIAL_POST` | Creates SocialPost | MEDIUM |

### Critical Risks

**1. No input validation on AI-provided updates (CRITICAL)**
- AI output is trusted to provide valid `updates` objects
- No schema validation per action type
- AI-created leads bypass duplicate detection entirely
- No rate limiting per action type — AI could create 100 broadcast logs in one conversation

**2. No action confirmation (HIGH)**
- Actions execute immediately without user confirmation
- `PUBLISH` makes a page live without asking "are you sure?"
- `ADD_LEAD` creates database records from AI hallucination

**3. No undo mechanism (HIGH)**
- `BUILD_PAGE` overwrites entire pageBlocks — no backup of previous version
- No action history or rollback capability

**4. Fragile JSON parsing (MEDIUM)**
- Response parsing tries 6 strategies (raw, markdown strip, regex, etc.)
- If all fail, falls back to raw text with action "NONE"
- User sees entire raw AI response dumped as text

**5. Silent failures (MEDIUM)**
- If Claude API is down, streaming returns empty response
- If action execution fails (Prisma error), error is caught and generic "action failed" shown
- No retry mechanism for transient failures

### How It Handles Unclear Input

- Unclear messages go to Claude as-is with full client context
- Claude may hallucinate actions that don't match user intent
- No clarification loop — if AI misunderstands, it executes wrong action immediately

---

## 6. Automation Risks

### WhatsApp Send Flow

| Component | Status | Issue |
|-----------|--------|-------|
| Green API integration | ⚠️ Risk | External dependency with no fallback. If Green API is down, all WhatsApp features fail silently |
| Auto-reply on new lead | ⚠️ Risk | Fire-and-forget: `.catch(() => {})` — no logging, no retry, no notification on failure |
| WhatsApp drip (Day 1) | ⚠️ Risk | Status updated to CONTACTED even if send fails. Bare catch blocks hide errors |
| WhatsApp drip (Day 3) | ⚠️ Risk | Same issue as Day 1 |
| Broadcast send | ⚠️ Risk | IP-based rate limiting only. No per-client limit. Concurrent broadcasts can duplicate messages |
| Property broadcast | ✅ Working | Proper ownership check, sends to matching subscribers |

### Email Automations

| Component | Status | Issue |
|-----------|--------|-------|
| Email sequence creation | ✅ Working | Trigger types, steps, delays all functional |
| Email sequence execution | ❌ Broken | **Emails NOT actually sent** — log records created with "sent" status but no Resend API call |
| Email templates | ✅ Working | CRUD operations functional |
| Report emails | ✅ Working | Uses Resend, actually delivers |
| Review request emails | ✅ Working | Uses Resend |

### Scheduling & Reminders

| Component | Status | Issue |
|-----------|--------|-------|
| Appointment creation | ✅ Working | Creates record, triggers notification |
| Appointment reminders | ⚠️ Risk | Relies on n8n webhook — if n8n down, no reminders sent. No fallback |
| Follow-up scheduling | ⚠️ Risk | `followUpAt` field used but cron doesn't validate it's not null explicitly |

### Webhooks

| Component | Status | Issue |
|-----------|--------|-------|
| n8n webhooks | ⚠️ Risk | **Blocks lead creation request** with retry loop (up to 3s sleep). If n8n is down, lead creation can timeout and fail |
| Stripe webhooks | ✅ Working | Signature verification, handles checkout/subscription/payment events |
| Facebook webhooks | ⚠️ Risk | Token management depends on meta-token-refresh cron. If cron fails, tokens expire silently |
| Custom incoming webhooks | ✅ Working | Per-user secret token validation |

### Push Notifications

| Component | Status | Issue |
|-----------|--------|-------|
| Push subscription | ✅ Working | PushSubscription model, browser permission request |
| Push delivery | ⚠️ Risk | Depends on browser support and subscription validity. No confirmation of delivery |

---

## 7. Database / API Risks

### Missing CASCADE DELETE Rules (CRITICAL)

When a client is deleted, these related records become orphans:

| Model | Line in schema.prisma | Impact |
|-------|----------------------|--------|
| Lead | 295 | Orphan leads with no parent client |
| IntakeForm | 368 | Orphan intake submissions |
| Workflow | 390 | Orphan workflow configs |
| Report | 426 | Orphan reports |
| Automation | 451 | Orphan automation rules |
| LandingPage | 496 | Orphan landing pages |
| Property | 537 | Orphan property listings |
| LeadForm | 612 | Orphan form definitions |
| BroadcastLog | 819 | Orphan broadcast records |

**Fix:** Add `onDelete: Cascade` to all 9 relations.

### Missing Database Indexes

| Field | Model | Query Pattern | Impact |
|-------|-------|---------------|--------|
| `phone` | Lead | Duplicate detection queries | Slow on large datasets |
| `userId` | PasswordResetToken | Filter by user | Minor |
| `clientId + createdAt` | Lead | Dashboard date-range queries | Slow at scale |
| `clientId + status` | Property | Filtered property lists | Slow at scale |

### Input Validation Gaps

**Properties API** (`/api/properties/route.ts`):
- No max length on `title`, `city`, `description`, `neighborhood`, `street` (DoS risk)
- No bounds on numeric fields: `rooms`, `floor`, `totalFloors`, `area` (can be negative)
- No max size on `images[]` and `features[]` arrays (can send 10,000 items)
- Enum query parameters (`status`, `propertyType`) not validated against allowed values

**AI Agent API** (`/api/ai/agent/route.ts`):
- No max length on `message` field (token overflow risk)
- `conversationHistory` array has no size limit
- No validation that history items have correct shape

**General pattern:** Most POST endpoints use Zod but with minimal constraints (`.min(1)` only). Missing: `.max()` limits, numeric bounds, array size limits.

### Race Conditions

1. **Duplicate lead detection** — check-then-create is not atomic. Two concurrent form submissions with same phone can both pass the duplicate check.
2. **Concurrent broadcasts** — two admins can trigger broadcasts simultaneously for the same client, causing duplicate messages to leads.
3. **A/B test winner selection** — if called twice concurrently, pageBlocks could be corrupted.

### Silent Error Pattern

Throughout the lead creation flow, all side-effects use `.catch(() => {})`:
```
leadActivity.create().catch(() => {})
sendWhatsAppNotification().catch(() => {})
triggerN8nWebhook().catch(() => {})
createNotification().catch(() => {})
```

This means: lead is created successfully (201), but WhatsApp notification, webhook, and activity log can all fail silently with zero visibility.

---

## 8. Performance / Scale Risks

### At 10 Users (Current)

| Area | Status | Notes |
|------|--------|-------|
| Database load | ✅ Fine | PostgreSQL handles this easily |
| API response times | ✅ Fine | Simple queries, proper pagination |
| WhatsApp sending | ✅ Fine | Low volume, Green API handles it |
| AI calls | ✅ Fine | Low concurrent usage |
| Storage | ✅ Fine | Minimal image uploads |

### At 50 Users

| Area | Status | Notes |
|------|--------|-------|
| Database load | ⚠️ Watch | Missing indexes on Lead.phone and Lead.clientId+createdAt will slow down |
| API response times | ⚠️ Watch | N+1 not detected, but in-memory rate limiting won't share across Vercel instances |
| WhatsApp sending | ⚠️ Risk | 50 users x 10 leads/day = 500 auto-replies/day. Green API free tier may throttle |
| AI calls | ⚠️ Risk | 50 concurrent AI agent sessions could hit Claude API rate limits |
| Cron jobs | ⚠️ Risk | Report generation iterates all clients sequentially — 50 clients = longer execution time |
| Broadcasts | ⚠️ Risk | 50 admins sending broadcasts simultaneously = Green API rate limit hit |

### At 200 Users

| Area | Status | Notes |
|------|--------|-------|
| Database load | ⚠️ Risk | Need indexes. Lead table with 200 clients x 100 leads = 20K rows, queries without indexes degrade |
| Rate limiting | ❌ Broken | In-memory rate limiting is per-instance. Vercel spins multiple instances = each has its own counter. Effectively no rate limiting |
| WhatsApp sending | ❌ Risk | 200 clients sending broadcasts = thousands of WhatsApp messages. Green API will throttle/block. Need queue system |
| AI calls | ❌ Risk | AI usage tracking exists but no hard spending cap. 200 users could generate significant API costs |
| Cron jobs | ❌ Risk | Sequential report generation for 200 clients may timeout (Vercel function limit: 10s-60s depending on plan) |
| File storage | ⚠️ Risk | 200 clients with property images + campaign images = significant Cloudinary usage. No cleanup for orphaned images |
| Email sequences | ❌ Broken | Already not sending. At 200 clients with active sequences, the "fake sent" logs would be massive |

### Specific Bottlenecks

1. **n8n webhook in lead creation path** — blocks response for up to 3s on retry. At 200 users with n8n configured, lead form submission latency becomes unacceptable.

2. **Report cron** — iterates all active clients, computes stats, creates records, sends emails. No batching, no parallelism. At 200 clients, likely hits Vercel function timeout.

3. **Broadcast processing** — Inngest handles async but Green API has rate limits. 200 clients x 50 leads = 10,000 WhatsApp messages. Need proper queue with backpressure.

4. **AI token tracking** — `AiUsage` model tracks per-request but no aggregation cache. Dashboard AI usage query scans all records.

---

## 9. UX / Visual Risks

### Where Users Get Lost

1. **5 page builder entry points** — Admin has 3, client has 2. No clear guidance on which to use.
2. **"Templates" menu item routes to "Snapshots"** — naming mismatch creates confusion.
3. **17-item client portal sidebar** — business owners see developer-level complexity (Automations, SEO, Emails, AI Designer).
4. **AI Agent vs AI Designer** — both start with "AI" but are completely different (chat vs images). Names don't clarify.

### Where Too Many Controls Appear

1. **Client detail page** has 10+ tabs at the same hierarchy level — no grouping or priority.
2. **Lead detail page** shows timeline, notes, status controls, contact info, source data all simultaneously.
3. **Email ecosystem** splits across 3 separate routes (`/email`, `/email-sequences`, `/email-templates`) that should be tabs.

### Where UI Doesn't Match System Logic

1. **Email sequences show "Active" toggle** but emails aren't actually sent — UI implies functionality that doesn't exist.
2. **Broadcast success screen says "Message sent to X recipients"** but some may have failed silently.
3. **WhatsApp setup wizard "Test message sent!" step** has a simulated 1.5s delay (not a real test).
4. **Lead scoring page** shows scores but the scoring algorithm's weights aren't visible or configurable.

### Where the System Feels Powerful but Confusing

1. **Admin Command Palette** (17 commands) + **Portal Command Palette** (12 commands) — powerful but undiscoverable for most users.
2. **n8n integration** requires external setup with no in-app guidance beyond showing webhook URLs.
3. **A/B testing** is technically sound but the "select winner" flow doesn't explain statistical significance.
4. **AI Agent can execute 10+ action types** but users don't know what's possible without trying suggestions.

---

## 10. Critical Fixes First

These must be fixed before launch:

| # | Issue | Severity | Effort | File |
|---|-------|----------|--------|------|
| 1 | Missing ownership check on `/api/properties/[id]` | CRITICAL | 15 min | `api/properties/[id]/route.ts` |
| 2 | Missing ownership check on `/api/clients/[id]/notifications` | CRITICAL | 10 min | `api/clients/[id]/notifications/route.ts` |
| 3 | Missing ownership check on `POST /api/appointments` | CRITICAL | 10 min | `api/appointments/route.ts` |
| 4 | Cron secret bypass when env var missing | CRITICAL | 5 min | `api/cron/email-sequences`, `reports`, `followups` |
| 5 | Email sequences not actually sending | CRITICAL | 30 min | `api/cron/email-sequences/route.ts` |
| 6 | WhatsApp drip: status updated even if send fails | CRITICAL | 15 min | `api/cron/whatsapp-drip/route.ts` |
| 7 | AI agent: no validation on database mutations | CRITICAL | 30 min | `api/ai/agent/stream/route.ts` |
| 8 | n8n webhook blocks lead creation (up to 3s) | CRITICAL | 30 min | `lib/n8n.ts`, `api/leads/route.ts` |

---

## 11. Important Fixes Next

Fix these within first week post-launch:

| # | Issue | Severity | Effort | File |
|---|-------|----------|--------|------|
| 9 | Add `onDelete: Cascade` to 9 models | HIGH | 20 min | `schema.prisma` |
| 10 | Add max length validation to all string inputs | HIGH | 45 min | Multiple API routes |
| 11 | Add array size limits (images, features) | HIGH | 15 min | `api/properties/route.ts` |
| 12 | Intake form: add duplicate detection | HIGH | 15 min | `api/intake/[clientSlug]/route.ts` |
| 13 | Add proper error logging (replace `.catch(() => {})`) | HIGH | 30 min | `api/leads/route.ts` and others |
| 14 | Broadcast: add per-client rate limiting | HIGH | 20 min | `api/broadcast/route.ts` |
| 15 | Client portal: verify client still active on token validation | HIGH | 15 min | `lib/clientAuth.ts` |
| 16 | Add missing database indexes (Lead.phone, etc.) | HIGH | 10 min | `schema.prisma` |
| 17 | Validate numeric fields (rooms, floor, area) | HIGH | 15 min | `api/properties/route.ts` |

---

## 12. Nice-to-Fix Later

Address these for stability and scale:

| # | Issue | Severity | Effort | Notes |
|---|-------|----------|--------|-------|
| 18 | Switch to Redis-backed rate limiting | MEDIUM | 2 hrs | Required for multi-instance deployment |
| 19 | Add atomic duplicate detection (DB constraint) | MEDIUM | 30 min | Prevents race condition on concurrent submissions |
| 20 | AI Agent: add action confirmation step | MEDIUM | 1 hr | Prevents accidental page publish, lead creation |
| 21 | AI Agent: add undo/rollback for BUILD_PAGE | MEDIUM | 1 hr | Backup previous pageBlocks before overwrite |
| 22 | Unify page builder entry points (5 → 2) | MEDIUM | 2 hrs | UX improvement |
| 23 | Reduce client portal sidebar (17 → 9 items) | MEDIUM | 1 hr | Progressive disclosure |
| 24 | Add cron job execution monitoring | MEDIUM | 1 hr | Alert on failures |
| 25 | Add WhatsApp connection status to dashboard | MEDIUM | 30 min | Prevent silent failures |
| 26 | Report cron: add batching/parallelism | MEDIUM | 1 hr | Required at 50+ clients |
| 27 | Remove JWT secret hardcoded defaults | LOW | 5 min | Force env var configuration |
| 28 | Merge email routes into single hub | LOW | 2 hrs | UX cleanup |

---

*This audit represents a point-in-time analysis. Re-audit recommended after critical fixes are applied.*
