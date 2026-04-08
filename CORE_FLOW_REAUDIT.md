# MarketingOS — Core Flow Re-Audit Report

*Generated: April 9, 2026*

---

## 1. Executive Summary

Five issues were identified in the previous audit and fixes were attempted. On re-audit:

- **Issue 1 (tenant isolation):** The previous fix was logically sound but had two weaknesses that could cause it to fail in practice. **Rewritten completely** with an explicit `allowedClientIds` approach that eliminates all edge cases.
- **Issues 2-5:** All correctly implemented in the previous session. **Verified by code inspection, no changes needed.**

| Issue | Previous Fix Status | This Session |
|-------|-------------------|--------------|
| 1. Admin leads tenant isolation | Incomplete — edge cases + Prisma `undefined` pitfall | **Rewritten and hardened** |
| 2. Portal API ownership | Correctly fixed | **Verified, no change** |
| 3. WhatsApp drip false success | Correctly fixed | **Verified, no change** |
| 4. FormBlock error visibility | Correctly fixed | **Verified, no change** |
| 5. Silent failure logging | Correctly fixed | **Verified, no change** |

---

## 2. Issue-by-Issue Status

### Issue 1: Admin Tenant Isolation Bypass

**Status before this fix:** PARTIALLY FIXED — code logic was correct for the happy path, but had two failure modes.

**Root cause of continued breakage:**

The previous fix used this pattern:
```javascript
const clientScope = session?.clientId
    ? [session.clientId]
    : superAdmin
    ? null
    : await prisma.client.findMany({
        where: { ownerId: session?.userId },  // ← PROBLEM HERE
        ...
      }).then(cs => cs.map(c => c.id));
```

**Failure mode 1:** If `session?.userId` is `undefined` (malformed JWT, edge case in token refresh, or any code path that creates a session without userId), Prisma treats `{ ownerId: undefined }` as `{}` — returning **ALL clients**. This would make `clientScope` contain every client ID in the system, and `clientScope.includes(searchParams.clientId)` would return `true` for any client.

**Failure mode 2:** The previous validation `(!clientScope || clientScope.includes(...))` relied on JavaScript truthiness of arrays. While technically correct (`![] === false`), this pattern is fragile and hard to reason about in security-critical code.

**Additionally:** The clients dropdown query on line 83 of the old code had the same `{ ownerId: session?.userId }` problem — it could return all clients if userId was undefined, leaking client names even if leads were filtered.

**Files changed:** `apps/web/app/admin/(protected)/leads/page.tsx`

**Exact fix implemented:**
1. Added explicit `if (!session) return <div />;` guard at top (line 24)
2. Replaced `clientScope` with `allowedClientIds: string[] | null` — explicitly typed, with `null` ONLY for super-admin
3. Added `if (!session.userId) allowedClientIds = [];` guard — prevents the Prisma undefined pitfall
4. Replaced the filter logic with a three-branch `if/else if/else` using `allowedClientIds === null` (strict equality, not truthiness)
5. Fixed the clients dropdown query to use `{ id: { in: allowedClientIds } }` instead of `{ ownerId: session?.userId }`

**Why this fix is correct:**
- `allowedClientIds` is either `null` (super-admin only) or a concrete `string[]`
- The `=== null` check is unambiguous — no truthiness confusion
- The Prisma query uses `{ id: { in: allowedClientIds } }` instead of `{ ownerId }` — it queries by the pre-computed list, not by a potentially-undefined field
- If `session.userId` is undefined, `allowedClientIds = []`, and `{ clientId: { in: [] } }` returns zero leads
- The `searchParams.clientId` can only narrow within `allowedClientIds` — the `else` branch always falls back to the full scope

**Verification:** VERIFIED BY CODE — every branch traced through. The `where` clause for non-super-admin ALWAYS includes `{ clientId: { in: allowedClientIds } }` or `{ clientId: specificOwnedId }`.

**Manual test required:** Yes — to confirm the dev server picks up the change.

**Test steps:**
1. Log in as a non-super-admin user
2. Visit `/admin/leads` — verify you see only your clients' leads
3. Visit `/admin/leads?clientId=UNOWNED_CLIENT_ID` — verify you see ONLY your clients' leads (the unowned clientId is ignored)
4. Visit `/admin/leads?clientId=OWNED_CLIENT_ID` — verify you see only that specific client's leads
5. Log in as super-admin — verify all leads visible and `?clientId=` filter works

---

### Issue 2: Portal API Ownership

**Status before this fix:** CORRECTLY FIXED (previous session)

**Verification:**
All 3 routes checked:
- `/api/portal/[slug]/performance/route.ts` — line 25: ownership check present
- `/api/portal/[slug]/pipeline-value/route.ts` — line 24: ownership check present
- `/api/portal/[slug]/ai-recommendations/route.ts` — line 29: ownership check present

Each route:
1. Fetches `ownerId` in the client select
2. Checks `adminSession && !isSuperAdmin(adminSession) && client.ownerId !== adminSession.userId` → 403
3. Still checks `clientPortal && clientPortal.clientId !== client.id` → 403

**Edge case analysis:** If `adminSession.userId` is undefined, `client.ownerId !== undefined` is always `true` → returns 403. Safe by default.

**Files changed:** None (this session)

**Verification:** VERIFIED BY CODE

**Manual test required:** Yes — same as previous session's instructions.

---

### Issue 3: WhatsApp Drip False Success

**Status before this fix:** CORRECTLY FIXED (previous session)

**Verification:**
- `sendWhatsApp()` confirmed to NEVER throw — always returns `{ ok: boolean, error?: string }` (lib/whatsapp.ts lines 62-109)
- Drip cron now uses `const result = await sendWhatsApp(...)` followed by `if (result.ok)` (lines 27-34)
- Status update `{ status: "CONTACTED" }` only executes inside the `if (result.ok)` branch
- Failed sends logged with `console.error` including lead ID and error message
- Response includes both `sent` and `failed` counts

**Files changed:** None (this session)

**Verification:** VERIFIED BY CODE

**Manual test required:** No — code path is deterministic and fully traced.

---

### Issue 4: FormBlock Error Visibility

**Status before this fix:** CORRECTLY FIXED (previous session)

**Verification:**
- `error` state initialized as `""` (line 19)
- `setError("")` clears on each new submit (line 29)
- `res.ok` checked — sets error on non-OK response (line 49)
- Network errors caught and shown (line 52)
- Error banner rendered in red above submit button (lines 147-149)
- `businessName` removed from payload (was previously hardcoded to `fullName`)
- Success state only set when `res.ok === true` (line 47)

**Files changed:** None (this session)

**Verification:** VERIFIED BY CODE

**Manual test required:** Yes — to visually confirm the error banner renders.

---

### Issue 5: Silent Failure Logging

**Status before this fix:** CORRECTLY FIXED (previous session)

**Verification:**
All 8 side effects checked (leads/route.ts lines 212-280):
1. `[lead-activity]` — line 220
2. `[lead-inbox-event]` — line 237
3. `[lead-workflow-webhook]` — line 239
4. `[lead-whatsapp-notify]` — line 241
5. `[lead-auto-reply]` — line 251
6. `[lead-auto-reply-lookup]` — line 252
7. `[lead-n8n-webhook]` — line 264
8. `[lead-n8n-direct]` — line 273
9. `[lead-notification]` — line 280

Each uses `.catch((err) => console.error("[tag]", identifier, err))`. All remain non-blocking. Lead creation returns 201 at line 282 regardless.

**Files changed:** None (this session)

**Verification:** VERIFIED BY CODE

**Manual test required:** No — logging pattern is deterministic.

---

## 3. Routes / Files Checked

| File | Action |
|------|--------|
| `apps/web/app/admin/(protected)/leads/page.tsx` | **REWRITTEN** — hardened tenant isolation |
| `apps/web/app/api/portal/[slug]/performance/route.ts` | Verified — ownership check correct |
| `apps/web/app/api/portal/[slug]/pipeline-value/route.ts` | Verified — ownership check correct |
| `apps/web/app/api/portal/[slug]/ai-recommendations/route.ts` | Verified — ownership check correct |
| `apps/web/app/api/cron/whatsapp-drip/route.ts` | Verified — result checking correct |
| `apps/web/components/builder/blocks/FormBlock.tsx` | Verified — error handling correct |
| `apps/web/app/api/leads/route.ts` | Verified — logging correct |
| `apps/web/lib/whatsapp.ts` | Verified — never throws |
| `apps/web/lib/auth.ts` | Verified — JWT payload structure |
| `apps/web/components/admin/LeadsView.tsx` | Verified — no client-side leads re-fetch |
| `apps/web/app/admin/(protected)/layout.tsx` | Verified — auth required |

---

## 4. Residual Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Duplicate lead race condition | Medium | Non-atomic findFirst then create. Needs DB unique constraint. |
| Email sequences don't actually send | High | `EmailSequenceLog` created with "sent" status but Resend not called. Out of scope for this fix. |
| In-memory rate limiting | Medium | Per-instance only. Needs Redis for multi-instance. |
| Client portal token not checked against isActive | Low | Deactivated client can access portal until token expires (7d). |
| No real-time lead updates | Low | Dashboards require page refresh. |

---

## 5. Launch Recommendation

**PROCEED WITH CAUTION**

The core lead flow (landing page → form → lead → CRM → WhatsApp) is now safe:
- Tenant isolation is enforced at every level
- WhatsApp status tracking is accurate
- Form errors are visible to users
- Side effect failures are logged

The **single highest remaining risk** is: email sequences are marked as "sent" without actually sending emails. This is not a security issue but is a feature correctness issue that will cause client confusion. It should be fixed before launch by either implementing the Resend integration or disabling the email sequences feature.
