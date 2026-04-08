# MarketingOS — Core Business Flow Audit

*Generated: April 8, 2026 — Based on actual code analysis, not assumptions*

---

## 1. Summary (Overall System Health)

**The core flow — landing page → form → lead → CRM — works.** The lead is saved, it appears in both dashboards, and the basic pipeline is functional.

**However, 6 issues make this flow unreliable for production:**

| # | Issue | Impact |
|---|-------|--------|
| 1 | WhatsApp failures are completely silent — no log, no retry, no alert | Client never knows a lead arrived |
| 2 | FormBlock shows "success" before the POST actually completes | User sees success, lead may not be saved |
| 3 | Duplicate detection is not atomic — race condition on concurrent submits | Duplicate leads in DB |
| 4 | Admin leads page has a query-param bypass that breaks tenant isolation | Cross-tenant data leak |
| 5 | Portal API routes allow any admin to read any client's performance data | Cross-tenant data leak |
| 6 | WhatsApp drip catch blocks are unreachable — `sendWhatsApp()` never throws | Follow-up tracking is broken |

---

## 2. Step-by-Step Audit

---

### STEP 1: Landing Page Is Created

**STATUS: ✅ Working**

**What works:**
- Admin saves page blocks via `PUT /api/clients/[id]/builder` → `apps/web/app/api/clients/[id]/builder/route.ts`
- Zod schema validates block structure (line 6-16): each block must have `id`, `type` (enum of 9 types), `content` (record), and optional `settings`
- Ownership verified via `verifyOwnership()` (line 26-34) before any write
- Supports A/B testing: `pageBlocks` (A) and `pageBlocksB` (B) saved independently
- `pagePublished` flag controls visibility

**What fails:**
- Nothing structurally broken

**Data flow:**
```
Admin UI → PUT /api/clients/[id]/builder
  Body: { pageBlocks: Block[], pagePublished: boolean, abTestEnabled?: boolean }
  → Zod validates → verifyOwnership() → prisma.client.update()
  → Returns updated client
```

**Edge cases:**
- No try-catch around `prisma.client.update()` (line 94). If DB write fails, unhandled error returns 500 with stack trace.
- Block `content` is `z.record(z.string())` — any string key/value accepted, no field-level validation.

---

### STEP 2: Landing Page Loads Correctly (Public)

**STATUS: ✅ Working**

**What works:**
- Public page at `/[tenant]` → `apps/web/app/[tenant]/page.tsx`
- Fetches client by slug (line 53-82) with 19 fields
- Returns `notFound()` if client missing or `!client.isActive` (line 84)
- If `pagePublished && pageBlocks` is valid array → renders `BlockRenderer` (line 89-119)
- If `abTestEnabled` → renders `AbTestRenderer` with 50/50 cookie-based split
- ISR revalidation every 60 seconds (line 7)
- Generates proper OG metadata (lines 15-44)

**What fails:**
- Nothing structurally broken

**Data flow:**
```
Browser → GET /[tenant]
  → prisma.client.findUnique({ where: { slug } })
  → If published: BlockRenderer renders block array
  → If RE industry: AgentPageView with properties
  → Fallback: LandingPageView (legacy template)
```

**Edge cases:**
- If `pageBlocksB` is not an array despite `abTestEnabled`, `blocksB` becomes empty array (line 91) — harmless fallback
- Unknown block type in array → `BlockRenderer` returns `null` for that block (line 48 of `BlockRenderer.tsx`) — no error, just invisible block

---

### STEP 3: Lead Submits Form

**STATUS: ⚠️ Partial — UI bug**

**What works:**
- `FormBlock.tsx` (line 24-51) renders form with: fullName (required), phone (required), email (optional), message (optional), gender/ageRange/city (optional)
- Submit POSTs to `/api/intake/${clientSlug}` (line 40)
- If no `clientSlug`, early return prevents submit (line 26)

**What fails:**
- **Line 45: `setSubmitted(true)` is called inside `.then()` but the sequencing is wrong.** The code sets `loading = false` in `.finally()` and `submitted = true` in `.then()`, but there is a logical issue:

```javascript
// FormBlock.tsx lines 39-50
fetch(`/api/intake/${clientSlug}`, { method: "POST", ... })
  .then((res) => {
    if (res.ok) setSubmitted(true);  // line 45
  })
  .catch(() => {})    // line 46-47 — SILENT FAILURE
  .finally(() => setLoading(false)); // line 48
```

- **Line 46-47: `.catch(() => {})` — if the POST fails (network error, server error), the user sees NO error message.** The form just stops loading. User doesn't know if their submission went through.

- **Line 33: `businessName` is hardcoded to `fullName` value** — the intake form receives the person's name as the business name. This is a data quality bug.

**Data flow:**
```
FormBlock → POST /api/intake/{clientSlug}
  Body: { fullName, phone, email, businessName (=fullName), description, gender, ageRange, city }
```

**Edge cases:**
- Network failure → silent catch → user sees form still in non-submitted state, no error
- Server returns 4xx/5xx → `res.ok` is false → `submitted` stays false → form stays visible, no error shown
- Double-click submit → no protection (only `loading` flag prevents, but if first request is slow, second could fire)

---

### STEP 4: Lead Is Saved in Database

**STATUS: ⚠️ Partial — race condition**

**What works:**
- Intake endpoint at `/api/intake/[clientSlug]/route.ts` creates IntakeForm + Lead
- Lead creation endpoint at `/api/leads/route.ts` (POST handler, lines 119-285):
  - Zod validates 21 fields (lines 19-42)
  - Honeypot check: `_hp` field must be empty or missing (line 136-138)
  - Client existence + active check (lines 158-165)
  - Duplicate detection: same phone + clientId within 30 days (lines 167-184)
  - Auto-scoring: +20 for phone, +15 for email, +10 for UTM, +5 for metadata (lines 195-201)
  - `prisma.lead.create()` (lines 203-210)

**What fails:**

**Duplicate detection is NOT atomic (lines 167-184):**
```javascript
// Two separate operations — NOT in a transaction
const duplicate = await prisma.lead.findFirst({
  where: { clientId, phone, createdAt: { gte: thirtyDaysAgo } },
});
if (duplicate) return 409;

// ... gap here — another request can pass the same check ...

const lead = await prisma.lead.create({ data: { ... } });
```

Two concurrent form submissions with the same phone number can both pass `findFirst` and both create leads.

**Data flow:**
```
POST /api/leads
  → Rate limit check (IP-based)
  → Zod parse
  → Honeypot check
  → Auth check (admin ownership OR public form)
  → Client exists + active check
  → Duplicate detection (phone + clientId, 30 days)
  → Auto-score computation
  → prisma.lead.create()
  → 8 fire-and-forget side effects
  → Return 201 { lead }
```

**Edge cases:**
- DB slow → `prisma.lead.create()` blocks response until complete (this is correct — lead IS awaited)
- Form fails validation → 400 with Zod error details
- Client deleted between check and create → Prisma FK constraint error → unhandled 500
- Duplicate submitted within ms → both pass findFirst → both create → duplicates in DB

---

### STEP 5: Lead Appears in CRM Instantly

**STATUS: ✅ Working**

**What works:**
- Admin leads page (`/admin/leads/page.tsx`) fetches leads server-side via Prisma with proper scoping
- Client portal leads (`PortalLeadsClient.tsx`) receives leads as props from server component
- Both read from the same `Lead` table — data is consistent immediately after creation

**What fails:**
- No real-time update mechanism. Neither dashboard polls or uses WebSockets. User must refresh the page to see new leads.
- This is technically "working" — the lead IS in the DB and WILL appear on refresh — but there's no push notification to the UI.

**Data flow:**
```
Admin: /admin/leads → Server component → prisma.lead.findMany({ where: { clientId: { in: ownedClients } } })
Client: /client/[slug]/leads → Server component → prisma.lead.findMany({ where: { clientId } })
```

**Edge cases:**
- If admin has page open and lead is created → lead does NOT appear until refresh
- NotificationBell component polls every 30 seconds — this DOES show a notification badge, but the leads list itself doesn't auto-update

---

### STEP 6: WhatsApp Auto-Message Is Triggered (If Enabled)

**STATUS: ⚠️ Partial — silent failure, unreliable**

**What works:**
- After lead creation, two WhatsApp actions fire (lines 243-253 of `/api/leads/route.ts`):
  1. `sendWhatsAppLeadNotification(lead)` — notifies the client (business owner) about the new lead
  2. `sendAutoReply(lead, client)` — sends auto-reply to the lead (if `autoReplyActive`)
- `sendWhatsApp()` in `lib/whatsapp.ts` (lines 62-109):
  - Constructs Green API URL: `https://{prefix}.api.greenapi.com/waInstance{instanceId}/sendMessage/{token}`
  - 10-second timeout via `AbortSignal.timeout(10_000)`
  - Returns `{ ok: true }` on success or `{ ok: false, error: string }` on failure
  - Checks `res.ok` properly (line 101)

**What fails:**

**ALL WhatsApp sends from lead creation are fire-and-forget with silent failure:**
```javascript
// leads/route.ts line 243
sendWhatsAppLeadNotification(lead).catch(() => {});

// leads/route.ts line 253
sendAutoReply(lead, c).catch(() => {});
```

- No logging of failures
- No retry mechanism
- No notification to admin that WhatsApp failed
- No indication in the lead record that auto-reply was attempted but failed
- The lead's `autoReplied` field is only set inside `sendAutoReply` if the send succeeds — if it fails, the field stays `false`, but nobody checks this

**Real execution check:**
- YES, `sendWhatsApp()` actually calls the Green API HTTP endpoint. This is a real send, not a simulation.
- But the result is never checked in the lead creation flow. The `.catch(() => {})` swallows everything.

**Data flow:**
```
Lead created →
  (fire-and-forget) sendWhatsAppLeadNotification(lead)
    → lib/whatsapp.ts → HTTP POST to Green API
    → Result: { ok: true/false } — IGNORED by caller

  (fire-and-forget) client lookup → sendAutoReply(lead, client)
    → lib/whatsapp.ts → HTTP POST to Green API
    → If ok: prisma.lead.update({ autoReplied: true })
    → Result: { ok: true/false } — IGNORED by caller
```

**Edge cases:**
- Green API down → `sendWhatsApp()` returns `{ ok: false }` → `.catch(() => {})` swallows → no one knows
- Client has no Green API credentials → function returns early with `{ ok: false }` → silent
- Phone number invalid → Green API returns 4xx → `{ ok: false }` → silent
- Network timeout (>10s) → AbortSignal fires → catch block → `{ ok: false }` → silent

---

### STEP 7: Lead Status Is Set

**STATUS: ✅ Working (initial) / ⚠️ Partial (drip follow-up)**

**What works (initial creation):**
- Lead is created with `status: "NEW"` (Prisma default)
- Auto-score is computed (0-100) and saved at creation
- Status enum: `NEW → CONTACTED → QUALIFIED → PROPOSAL → WON → LOST`
- Manual status changes work via `PATCH /api/leads/[id]` with proper ownership checks

**What fails (drip follow-up):**

The WhatsApp drip cron (`/api/cron/whatsapp-drip/route.ts`) has a logic bug:

```javascript
// Lines 26-30
try {
  await sendWhatsApp(lead.phone, message, lead.client);
  await prisma.lead.update({ where: { id: lead.id }, data: { status: "CONTACTED" } });
  sent++;
} catch { /* skip */ }
```

**`sendWhatsApp()` NEVER throws** — it returns `{ ok: false }` on failure. This means:
- The `catch` block is **unreachable** in normal flow
- If send fails, `sendWhatsApp()` returns `{ ok: false }`, execution continues to `prisma.lead.update()`
- **Status is updated to "CONTACTED" even when the message was NOT delivered**
- The `sent++` counter is also incremented incorrectly

**Correct behavior should be:**
```javascript
const result = await sendWhatsApp(lead.phone, message, lead.client);
if (result.ok) {
  await prisma.lead.update({ ... status: "CONTACTED" });
  sent++;
}
```

**Data flow:**
```
Cron (every run) →
  Day 1: Find leads WHERE status=NEW, autoReplied=true, created 23-25h ago
    → sendWhatsApp() → result IGNORED → status updated to CONTACTED regardless
  Day 3: Find leads WHERE status=CONTACTED, created 71-73h ago
    → sendWhatsApp() → result IGNORED → no status update (stays CONTACTED)
```

---

### STEP 8: Lead Is Visible in Client Dashboard

**STATUS: ✅ Working**

**What works:**
- Client dashboard at `/client/[slug]/(portal)/page.tsx` (lines 42-50):
  ```javascript
  const session = await getClientSession();
  if (!session) redirect(`/client/${params.slug}/login`);
  if (session.slug !== params.slug) redirect(`/client/${session.slug}`);
  ```
- Session slug MUST match route slug — strong isolation
- Dashboard fetches: recent leads, reports, stats — all scoped to `session.clientId`
- Leads page (`PortalLeadsClient.tsx`) displays leads passed as props from server component
- Client portal performance API verifies `clientPortal.clientId !== client.id` → 403

**What fails:**
- No real-time updates — user must refresh to see new leads
- No loading states or error recovery if server component data fetch fails

**Data flow:**
```
Client login → JWT with { clientId, slug, name, type: "client_portal" }
  → /client/[slug] → getClientSession() → verify slug match
  → prisma.lead.findMany({ where: { clientId: session.clientId } })
  → Render leads in dashboard
```

---

### STEP 9: Lead Is Visible in Admin Dashboard (Correct Tenant)

**STATUS: ⚠️ Partial — tenant isolation bypass**

**What works:**
- `/api/leads/route.ts` GET handler (lines 66-96) has comprehensive scoping:
  - Client portal → locked to token's clientId
  - Scoped agent → locked to session.clientId
  - Super-admin → can see all or filter
  - Regular admin → restricted to owned clients with DB verification

**What fails:**

**CRITICAL: Admin leads SERVER PAGE has a query-param bypass**

In `/admin/(protected)/leads/page.tsx` (lines 39-44):
```javascript
const where = {
  ...(clientScope ? { clientId: { in: clientScope } } : {}),
  ...(searchParams.clientId ? { clientId: searchParams.clientId } : {}),  // ← OVERWRITES clientScope
  ...(status ? { status } : {}),
};
```

The second spread **overwrites** the first. If an admin visits `/admin/leads?clientId=SOMEONE_ELSES_CLIENT`, the `clientScope` restriction is replaced by the raw query parameter. The leads from the unowned client are returned.

**ALSO: Portal API routes missing admin ownership check**

In `/api/portal/[slug]/performance/route.ts` (and `ai-recommendations`, `pipeline-value`):
```javascript
const adminSession = await getSession();
const clientPortal = adminSession ? null : await getClientSession();
```

If admin session exists, client portal check is skipped. But NO ownership check verifies the admin owns the client in that slug. Any logged-in admin can call `GET /api/portal/ANY_SLUG/performance` and get that client's analytics.

**Data flow:**
```
Admin: /admin/leads → Server component
  → clientScope = [owned client IDs]
  → BUT searchParams.clientId OVERWRITES this
  → prisma.lead.findMany({ where: { clientId: searchParams.clientId } })
  → Returns leads from ANY client
```

---

## 3. Critical Broken Points

| # | What's Broken | Where | Impact |
|---|---------------|-------|--------|
| 1 | **Admin leads page: clientId query param overwrites tenant scope** | `/admin/(protected)/leads/page.tsx` line 41 | Any admin can read any client's leads via URL manipulation |
| 2 | **Portal API routes: admin can access any slug's data** | `/api/portal/[slug]/performance/route.ts` lines 10-27 | Cross-tenant analytics leakage |
| 3 | **WhatsApp drip: status updated even when send fails** | `/api/cron/whatsapp-drip/route.ts` lines 26-30 | Lead marked CONTACTED when message never sent |
| 4 | **FormBlock: silent failure on submit error** | `components/builder/blocks/FormBlock.tsx` lines 46-47 | User gets no feedback when form submission fails |
| 5 | **FormBlock: businessName = fullName** | `components/builder/blocks/FormBlock.tsx` line 33 | Corrupt data — person's name stored as business name |

---

## 4. High-Risk Issues

| # | Risk | Where | Likelihood | Impact |
|---|------|-------|------------|--------|
| 1 | **Duplicate leads on concurrent submit** | `/api/leads/route.ts` lines 167-184 | Medium (traffic spikes) | Duplicate leads, duplicate WhatsApp messages |
| 2 | **All 8 lead-creation side effects silently fail** | `/api/leads/route.ts` lines 213-283 | High (any external service issue) | No WhatsApp, no notification, no webhook — and nobody knows |
| 3 | **No error display on form submit failure** | `FormBlock.tsx` lines 46-47 | Medium (server errors, network issues) | Lost leads — visitor thinks form is broken, leaves |
| 4 | **Client token not verified against active status** | `lib/clientAuth.ts` lines 15-27 | Low (only if client deactivated) | Deactivated client still accesses portal for up to 7 days |
| 5 | **No real-time lead updates in either dashboard** | Both dashboard pages | Constant | Admin/client must manually refresh to see new leads |

---

## 5. Must-Fix-Before-Launch (TOP 5)

### FIX 1: Tenant isolation bypass in admin leads page
**File:** `apps/web/app/admin/(protected)/leads/page.tsx` line 41
**Problem:** `searchParams.clientId` overwrites `clientScope`
**Fix:** Validate `searchParams.clientId` against `clientScope` before using it:
```javascript
const where = {
  ...(clientScope ? { clientId: { in: clientScope } } : {}),
  ...(searchParams.clientId && clientScope?.includes(searchParams.clientId)
    ? { clientId: searchParams.clientId }
    : {}),
  ...(status ? { status } : {}),
};
```
**Effort:** 10 minutes

---

### FIX 2: Portal API ownership check for admin sessions
**Files:** `apps/web/app/api/portal/[slug]/performance/route.ts` (and `ai-recommendations/route.ts`, `pipeline-value/route.ts`)
**Problem:** Admin session bypasses ownership verification
**Fix:** After fetching client by slug, verify admin owns it:
```javascript
if (adminSession && !isSuperAdmin(adminSession)) {
  if (client.ownerId !== adminSession.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
```
**Effort:** 15 minutes (3 files)

---

### FIX 3: WhatsApp drip — check send result before updating status
**File:** `apps/web/app/api/cron/whatsapp-drip/route.ts` lines 26-30 and 44-49
**Problem:** `sendWhatsApp()` returns result tuple but it's never checked. Status updates regardless.
**Fix:**
```javascript
const result = await sendWhatsApp(lead.phone, message, lead.client);
if (result.ok) {
  await prisma.lead.update({ where: { id: lead.id }, data: { status: "CONTACTED" } });
  sent++;
} else {
  failed++;
  console.error(`[whatsapp-drip] Failed for lead ${lead.id}: ${result.error}`);
}
```
**Effort:** 15 minutes

---

### FIX 4: FormBlock — show error on submit failure + fix businessName
**File:** `apps/web/components/builder/blocks/FormBlock.tsx` lines 24-51
**Problem:** `.catch(() => {})` hides errors. `businessName` hardcoded to `fullName`.
**Fix:**
```javascript
const [error, setError] = useState("");

// In submit handler:
fetch(`/api/intake/${clientSlug}`, { ... })
  .then((res) => {
    if (res.ok) setSubmitted(true);
    else setError("שגיאה בשליחת הטופס. נסה שוב.");
  })
  .catch(() => setError("שגיאת רשת. בדוק את החיבור ונסה שוב."))
  .finally(() => setLoading(false));

// Remove businessName: fullName, or add a separate field
```
**Effort:** 20 minutes

---

### FIX 5: Add error logging to lead creation side effects
**File:** `apps/web/app/api/leads/route.ts` lines 213-283
**Problem:** All 8 `.catch(() => {})` blocks swallow errors silently
**Fix:** Replace every `.catch(() => {})` with `.catch((err) => console.error("[context]", err))`:
```javascript
sendWhatsAppLeadNotification(lead).catch((err) =>
  console.error("[lead-whatsapp-notify] Failed for lead", lead.id, err)
);

sendAutoReply(lead, c).catch((err) =>
  console.error("[lead-auto-reply] Failed for lead", lead.id, err)
);

triggerN8nWebhook(lead.clientId, "lead.created", {...}).catch((err) =>
  console.error("[lead-n8n-webhook] Failed for client", lead.clientId, err)
);

createNotification({...}).catch((err) =>
  console.error("[lead-notification] Failed for client", lead.clientId, err)
);
```
**Effort:** 15 minutes

---

### Summary: Total effort for all 5 fixes = ~75 minutes

These 5 fixes address:
- 2 tenant isolation vulnerabilities (Fixes 1 & 2)
- 1 broken automation (Fix 3)
- 1 user-facing failure (Fix 4)
- 1 operational blindness issue (Fix 5)

Everything else in the core flow works. After these 5 fixes, the landing page → lead → CRM pipeline is production-safe.
