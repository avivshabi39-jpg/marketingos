# MarketingOS — Pre-Launch QA Audit

*Generated: April 12, 2026*

---

## 1. System Flows Summary

### Lead Capture Flow
```
Landing page → FormBlock submits to /api/intake/{slug} → Zod validation → IntakeForm + Lead created
→ leadScore computed → LeadActivity logged → InboxEvent created → Notification sent
→ Auto-reply via WhatsApp (if configured) → autoReplied flag set → Lead visible in CRM
```
**Status:** Functional. Bugs in edge cases (see below).

### WhatsApp Flow
```
Auto-reply: Lead created → sendAutoReply() → decrypt token → sendWhatsApp() → autoReplied=true
Day 1 drip: Cron (24h) → status=NEW + autoReplied=true → check activity log → send → status=CONTACTED
Day 3 drip: Cron (72h) → status=CONTACTED → check Day 1 activity exists → send
Manual: Click "וואצאפ" button → wa.me/{phone}?text={message} → status → CONTACTED → log activity
```
**Status:** Functional but fragile — decrypt() can crash if ENCRYPTION_KEY missing.

### Client Portal Flow
```
Login → Dashboard (Michael AI + metrics + checklist + insights + leads) → Leads page
→ Status buttons (CONTACTED/QUALIFIED/PROPOSAL/WON/LOST) → Lost reason picker → WhatsApp action
```
**Status:** Functional. Some UX friction (see below).

### Admin Control Tower Flow
```
Login → Dashboard (KPIs + Michael summary + client table + alerts)
→ Filter/search → Client drill-down (overview + tabs)
```
**Status:** Functional.

---

## 2. Critical Issues (Must Fix Before Testers)

### CRITICAL-1: decrypt() crashes if ENCRYPTION_KEY env var missing
**Where:** `lib/autoReply.ts` line 59, `cron/whatsapp-drip/route.ts` lines 70 & 148
**Why:** `decrypt()` calls `getKey()` which throws `Error: ENCRYPTION_KEY is not set`. This crashes the entire intake flow (auto-reply fails) and the entire drip cron (no follow-ups sent). No try-catch wraps these calls.
**Fix:** Wrap decrypt calls in try-catch, OR ensure ENCRYPTION_KEY is in Vercel env vars (it must be there for WhatsApp to work at all). Add to the required env var checklist.

### CRITICAL-2: Metadata spread can crash on non-object metadata
**Where:** `api/leads/[id]/route.ts` line 71
**Why:** `...((lead.metadata as Record<string, unknown>) ?? {})` — if `lead.metadata` is a string, number, or array (all valid JSON), the spread operator throws TypeError. This crashes the PATCH endpoint.
**Fix:** Add type guard: `typeof lead.metadata === "object" && !Array.isArray(lead.metadata) ? lead.metadata : {}`

### CRITICAL-3: Day 3 drip — findFirst() not wrapped in try-catch
**Where:** `cron/whatsapp-drip/route.ts` line 130
**Why:** `prisma.leadActivity.findFirst()` is awaited inside the Day 3 loop without try-catch. If this query fails (DB timeout, connection error), the entire Day 3 loop stops and no remaining leads get processed.
**Fix:** Wrap the findFirst call in try-catch, skip the lead on error.

---

## 3. Medium Issues (Can Survive Testers)

### MEDIUM-1: lostReason saved without requiring status=LOST
**Where:** `api/leads/[id]/route.ts` lines 70-72
**Why:** User can send `{ lostReason: "expensive" }` without `status: "LOST"`. The lostReason gets merged into metadata even though lead status doesn't change. Data integrity issue.
**Fix:** Only merge lostReason if `parsed.data.status === "LOST"`.

### MEDIUM-2: Empty firstName possible from whitespace-only input
**Where:** `api/intake/[clientSlug]/route.ts` line 115
**Why:** If fullName is " " (spaces only), `fullName.trim().split(" ")` returns `[""]`, making firstName an empty string. Lead created with `firstName=""`.
**Fix:** Add check: `if (!firstName) firstName = "ליד";`

### MEDIUM-3: FormBlock double-submit possible
**Where:** `components/builder/blocks/FormBlock.tsx` lines 25-56
**Why:** `loading` state disables the button visually, but rapid clicks before state updates can fire two fetches. No server-side idempotency key.
**Fix:** Already has duplicate detection in intake API (phone + 30 days). Risk is low but not zero.

### MEDIUM-4: Fire-and-forget WhatsApp activity log
**Where:** `PortalLeadsClient.tsx` lines 160-164
**Why:** The `/api/leads/{id}/note` POST is sent with `.catch(() => {})`. If the endpoint fails or doesn't exist, user has no idea the activity wasn't logged.
**Fix:** This is fire-and-forget by design. Low risk but audit trail has a gap.

---

## 4. UX Friction Points

### FRICTION-1: WhatsApp opens but status changes before user sends
When user clicks "וואצאפ", status immediately changes to CONTACTED. But the user may not actually send the message. The wa.me URL just opens WhatsApp — sending is a separate user action.
**Impact:** False CONTACTED status. Leads appear handled when they're not.

### FRICTION-2: Lost reason picker positioning
The inline popover appears above the LOST button (`absolute bottom-full`). On the first/top lead card, this may render outside the viewport or get clipped.
**Impact:** User can't see the reason picker on top cards.

### FRICTION-3: No loading state on lost reason selection
After clicking a lost reason, there's no visual feedback until the API responds and the toast appears.
**Impact:** User might click multiple reasons rapidly.

### FRICTION-4: Onboarding checklist "Share link" step can't auto-complete
The step completes when `pagePublished && hasLeads`. But the user may have shared the link without getting a lead yet. The step stays incomplete even after sharing.
**Impact:** Checklist feels stuck on step 3.

### FRICTION-5: Conversion insights show before enough data
With 1-2 leads, some insights trigger prematurely (e.g., "low conversion rate" with 2 leads and 0 won).
**Impact:** Insights feel noisy early on. Currently mitigated by `totalLeads >= 10` check on the low-conversion rule, but other rules have no minimum.

---

## 5. Data Inconsistencies

### CONSISTENCY-1: autoReplied flag — timing gap
The auto-reply flow: send WhatsApp → if ok → update `autoReplied=true` (fire-and-forget via Prisma). If the Prisma update fails silently, `autoReplied` stays false. The Day 1 drip checks `autoReplied=true` — this lead would never get a follow-up.
**Risk:** Low. Prisma updates rarely fail. But the flag is the sole gate for the drip chain.

### CONSISTENCY-2: Untreated stats use only recentLeads (10 items)
The dashboard computes `untreatedStats` from `recentLeads` (top 10 by createdAt). If user has 30 NEW leads, only the 10 most recent are counted. But `newLeadsCount` is a full count. The untreated alert may show "4 leads waiting" when `newLeadsCount` says 30.
**Fix:** Use `newLeadsCount` for the untreated count, and compute critical-only from recentLeads. Or accept the approximation.

### CONSISTENCY-3: SLA computed client-side
SLA labels (GOOD/WARNING/CRITICAL) are computed in the browser using `Date.now()`. Server and client clocks may differ by minutes. A lead at exactly 30 minutes may show WARNING on one device and CRITICAL on another.
**Risk:** Very low. Acceptable for this product stage.

---

## 6. Final Verdict

### **READY FOR TESTERS — with 3 conditions:**

1. **Set ENCRYPTION_KEY in Vercel env vars.** Without it, WhatsApp auto-reply and drip follow-ups crash the entire flow. This is the single biggest production risk.

2. **Fix metadata spread crash** in leads PATCH (CRITICAL-2). This is a 1-line fix that prevents TypeError on PATCH requests.

3. **Wrap Day 3 findFirst in try-catch** (CRITICAL-3). Prevents one bad lead from killing the entire drip cron run.

**With those 3 fixes, the system is safe for testers.** The medium issues and UX friction points are real but non-blocking — testers can work around them and they can be fixed in the next iteration.

**What will testers NOT be able to test without env vars:**
- WhatsApp auto-reply (needs GREEN_API_INSTANCE_ID + GREEN_API_TOKEN + ENCRYPTION_KEY)
- AI agent features (needs ANTHROPIC_API_KEY)
- Email notifications (needs RESEND_API_KEY)
- Billing (needs STRIPE_SECRET_KEY)

**What testers CAN test without any extra env vars:**
- Form submission and lead creation
- CRM lead management (status, lost reason, heat, SLA)
- Dashboard views (metrics, insights, checklist)
- Admin Control Tower (clients, filtering, drill-down)
- Sidebar navigation
- Onboarding flow
