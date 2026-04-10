# MarketingOS — AI-First Product Blueprint

*Generated: April 10, 2026*
*Based on: System Map, UX Audit, AI Agent Audit, Core Flow Audit*

---

## 1. Executive Summary

This blueprint restructures MarketingOS around the AI agent ("Michael") as the primary operating layer. It uses ONLY existing capabilities — no new features, no new APIs, no new models. The changes are structural: what appears where, what the user sees first, what requires navigation vs conversation, and what gets hidden.

**The core shift:** Today the product is a 17-menu dashboard where AI is one feature among many. The target is a 5-item interface where the AI is the first thing the user interacts with, and manual pages exist as fallbacks.

**What makes this possible TODAY:**
- The AI agent already executes 10 real database actions (build page, publish, add lead, broadcast, etc.)
- The AI already generates 15+ content types (emails, social posts, WhatsApp messages, etc.)
- The AI already has a personified identity ("Michael") with context-aware greetings
- The AI already streams responses in real-time with action confirmation

**What this blueprint does NOT require:**
- No new AI endpoints
- No new database models
- No new external integrations
- No new pricing tiers

---

## 2. AI-First User Experience

### What the user sees immediately after login

**The dashboard becomes two zones:**

**Zone 1 (top half, above the fold): Michael**
A chat input with Michael's greeting and 4 action cards. This is what the user sees first — before any metrics, before any tables, before any widgets.

Michael's greeting is dynamic (this already exists in `PortalAiAgentClient.tsx` but currently lives on a separate page):

**If first login (no page built):**
> "שלום [Name]! 👋 אני מיכאל — היועץ השיווקי שלך.
> בוא נכין את המערכת שלך. ספר לי ב-2-3 משפטים על העסק שלך, ואני אבנה לך דף נחיתה מקצועי תוך דקה."

**If page exists but no leads:**
> "שלום [Name]! הדף שלך באוויר אבל עוד לא הגיעו לידים.
> הנה מה שכדאי לעשות עכשיו: שתף את הקישור שלך או שלח פוסט לפייסבוק."

**If active (has page + leads):**
> "בוקר טוב [Name]! 📊 הגיעו [X] לידים חדשים השבוע.
> שיעור ההמרה שלך [Y]%. המקור המוביל: [Source].
> איך אפשר לעזור?"

Below the greeting: a text input ("שאל את מיכאל...") and 4 quick-action cards.

**Zone 2 (bottom half, below the fold): Data**
Compact metrics strip (4 numbers: leads this month, conversion rate, page views, pipeline value) + recent leads table. No pipeline banners, no source charts, no activity feeds, no share centers, no design controls.

### What the AI says first

The AI greeting already exists and is context-aware. The change is WHERE it appears — on the dashboard, not on a separate page.

The 4 quick-action cards below the greeting:

| Card | Label | What it triggers |
|------|-------|-----------------|
| 🌐 | "בנה / ערוך את הדף שלי" | Opens Michael with "I want to work on my page" |
| 🎯 | "הלידים שלי" | Navigates to leads page |
| 📱 | "שלח הודעה" | Opens Michael with "I want to send a message to my leads" |
| 📊 | "איך הולך לי?" | Opens Michael with "Show me my performance" |

### The 3-4 primary actions exposed

Only 4 things are visible above the fold:
1. **Michael's chat** (greeting + input field)
2. **Page** (build or edit — one card, not two)
3. **Leads** (view and manage)
4. **Send message** (WhatsApp broadcast or follow-up)

Everything else is accessible through Michael or through the simplified sidebar.

---

## 3. Top 4 Core Actions

### Action 1: Landing Page (Build / Edit / Publish)

**Why primary:** This is the user's storefront. Without a page, nothing else works — no leads come in, no reports generate, no broadcasts have recipients. The AI is already strongest at this (BUILD_PAGE, UPDATE_HERO, UPDATE_COLOR, PUBLISH all work today).

**How AI initiates it:**
- First-time user: Michael's greeting IS the page builder prompt ("tell me about your business")
- Returning user: "My Page" card opens Michael with page context
- Michael shows a preview link after building, asks "Ready to publish?" before setting `pagePublished: true`

**What exists today:** BUILD_PAGE action, page builder wizard (13 steps), inline ClientPageAgent
**What changes:** The 13-step wizard becomes optional. Michael replaces it with 1-2 conversational questions. The separate "Build Page" and "Edit Page" sidebar items merge into one "My Page" item.

### Action 2: Leads (View / Follow-up / Manage)

**Why primary:** Leads are the daily heartbeat. Every business owner opens the app to check "did I get new leads?" This must be instant — not buried under widgets.

**How AI initiates it:**
- Michael's greeting already includes lead counts ("הגיעו X לידים חדשים")
- "Leads" card goes directly to the leads page (not through AI, because the AI currently cannot list specific leads by name)
- Michael CAN help with: "draft a follow-up message for my new leads" → generates WhatsApp text

**What exists today:** Leads list page, SHOW_STATS action, ADD_LEAD action, WhatsApp message generation
**What currently CANNOT be done by AI:** List leads by name, update lead status, add notes, schedule follow-ups. These stay manual.
**What changes:** Leads gets promoted to the 2nd sidebar item (currently missing from admin sidebar entirely).

### Action 3: Communication (WhatsApp / Broadcast / Social)

**Why primary:** After seeing leads, the user's next question is "what should I say to them?" This is where AI adds the most daily value — drafting messages, not navigating menus.

**How AI initiates it:**
- User clicks "Send message" → Michael asks: "Who do you want to reach? All new leads? Everyone?"
- Michael drafts the message → shows preview in chat → user approves → BROADCAST action executes
- For social posts: "Write me a Facebook post about my business" → GENERATE_POST creates draft

**What exists today:** BROADCAST action, GENERATE_POST action, WhatsApp/social text generation endpoints
**Gap that stays:** AI cannot send to a single specific lead (only mass broadcast). Single-lead messaging stays manual from the lead detail page.
**What changes:** "Broadcast," "Social Posts," and "Emails" sidebar items merge under a single "Marketing" item.

### Action 4: Performance (Reports / Analytics / Insights)

**Why primary:** Business owners need to know "is this working?" without reading charts. The AI can answer this conversationally.

**How AI initiates it:**
- Michael's greeting already includes key numbers when leads exist
- "How am I doing?" card → Michael responds with narrative: "This week you got 12 leads, 3 more than last week. Facebook is your best source. Your conversion rate is 15%."
- Michael can generate a report: CREATE_REPORT action

**What exists today:** SHOW_STATS action, CREATE_REPORT action, weekly-report-summary endpoint, dashboard stat cards
**What changes:** "Reports" and "Analytics" merge into one "Reports" sidebar item. The Performance section, AI recommendations, and stat cards consolidate into a single compact metrics strip on the dashboard.

---

## 4. AI Action Flows

### Flow 1: Build Landing Page

**User says:** "בנה לי דף נחיתה" (Build me a landing page)

**Michael responds:**
> "בשמחה! ספר לי ב-2-3 משפטים על העסק שלך — מה אתה עושה ולמי."

**User says:** "אני מנהל חברת ניקיון בתל אביב, שירות לבתים ומשרדים"

**Michael responds:**
> "מעולה! הנה מה שבניתי לך:
> 📌 כותרת: 'ניקיון מקצועי בתל אביב — נקיון שמרגישים'
> 📌 צבע מותג: #2563eb
> 📌 קטעים: גיבור, יתרונות, טופס יצירת קשר, כפתור וואצאפ
>
> רוצה שאפרסם את הדף? או שתרצה לשנות משהו קודם?"

**Confirmation required:** YES — before PUBLISH. Not before BUILD_PAGE (building a draft is safe).

**What happens after execution:**
- BUILD_PAGE saves blocks to database (draft)
- User confirms → PUBLISH sets pagePublished=true
- Michael responds: "✅ הדף שלך באוויר! הנה הקישור: [URL]. שתף אותו עם לקוחות."

### Flow 2: Check Leads / Performance

**User says:** "מה קורה אצלי?" (What's my status?)

**Michael responds:**
> "📊 הנה הסיכום שלך:
> • השבוע הגיעו 8 לידים חדשים (3 יותר מהשבוע שעבר!)
> • שיעור המרה: 12%
> • המקור המוביל: פייסבוק
> • 2 לידים ממתינים למענה
>
> רוצה שאכין לך הודעת מעקב?"

**Confirmation required:** NO — this is read-only information.

**What happens after:** Michael suggests next action based on data (follow-up, broadcast, or page improvement).

### Flow 3: Send WhatsApp Broadcast

**User says:** "שלח הודעה ללידים החדשים" (Send a message to new leads)

**Michael responds:**
> "יש לך 12 לידים עם מספר טלפון. הנה הודעה שהכנתי:
>
> 'שלום! 👋 ראיתי שפנית לשירותי ניקיון. נשמח לתת לך הצעת מחיר. מתי נוח לדבר? 📞'
>
> לשלוח את ההודעה ל-12 נמענים?"

**Confirmation required:** YES — always before BROADCAST. Real messages to real people.

**What happens after execution:**
- BROADCAST creates BroadcastLog with status "pending"
- Worker sends messages asynchronously
- Michael responds: "✅ ההודעה נשלחה ל-12 לידים! תוכל לראות את הסטטוס בעמוד השידורים."

### Flow 4: Generate Social Post

**User says:** "כתוב לי פוסט לפייסבוק" (Write me a Facebook post)

**Michael responds:**
> "הנה פוסט שהכנתי:
>
> '🏠✨ בית נקי = ראש נקי!
> שירותי ניקיון מקצועיים בתל אביב — בתים, משרדים ומרחבים מסחריים.
> 📞 צרו קשר לקבלת הצעת מחיר!
> #ניקיון #תלאביב #שירותניקיון'
>
> לשמור כטיוטה?"

**Confirmation required:** NO — GENERATE_POST saves as DRAFT (not published). User must publish manually from the social page.

**What happens after:** Michael responds: "✅ נשמר כטיוטה! תוכל לפרסם ולתזמן אותו מעמוד הפוסטים."

### Flow 5: Generate Report

**User says:** "צור דוח שבועי" (Create weekly report)

**Michael responds:**
> "📊 הנה הדוח השבועי שלך:
> • סה"כ לידים: 34
> • נסגרו: 5 (15% המרה)
> • מקור מוביל: גוגל
> • לידים חדשים שלא טופלו: 3
>
> שולח את הדוח?"

**Confirmation required:** NO — CREATE_REPORT is a harmless data aggregation.

**What happens after:** Report row created in database. Michael responds: "✅ הדוח נוצר! תוכל לצפות בו ולשלוח אותו מעמוד הדוחות."

---

## 5. What To Hide / Move

### Remove from main dashboard entirely:

| Current Widget | Why Remove |
|---------------|------------|
| N8n automation hub | Technical, irrelevant to business owners |
| 6 quick-action buttons (colorful grid) | Replaced by Michael's 4 action cards |
| Pipeline banner (dark gradient) | Replaced by compact metrics strip |
| Lead sources chart | Available through "How am I doing?" in Michael |
| Activity feed | Low value, passive information |
| Share Center | Move to "My Page" section |
| Quick design controls | Move to "My Page" section |
| Setup progress bar | Remove (keep checklist only, until completed) |
| AI Recommendations section | Merged into Michael's greeting |
| AI Tools section | Merged into Michael |
| AI Agent card | Michael IS on the dashboard now |
| Lead form link | Move to "My Page" section |
| Performance section (4 mini-metrics) | Merged into compact metrics strip |

### Move to secondary pages (accessible via sidebar):

| Feature | New Location |
|---------|-------------|
| Appointments / Scheduling | Under "More" or via sidebar |
| Email sequences | Under "Marketing" sidebar item |
| Email templates | Under "Marketing" sidebar item |
| Social posts management | Under "Marketing" sidebar item |
| Broadcast history | Under "Marketing" sidebar item |
| SEO & Google | Inside "My Page" as a tab |
| Analytics (detailed) | Inside "Reports" as a tab |
| AI Designer (image generation) | Accessible through Michael ("create an image for me") |
| Properties (real estate) | Stays in sidebar for RE industry only |
| Automations | Under "Settings" |
| Help | Accessible through Michael ("help me with...") |

### Features that should only be triggered through Michael:

| Feature | Why AI-Only |
|---------|------------|
| Page building from scratch | Michael asks 1-2 questions instead of 13-step wizard |
| Social post generation | Michael generates better with business context |
| Performance summary | Michael narrates instead of showing raw numbers |
| WhatsApp message drafting | Michael personalizes based on lead data |
| Weekly report summary | Michael explains instead of showing tables |

---

## 6. New Sidebar Structure

### Current Client Sidebar (17 items, no groups):
Dashboard, Leads, Properties, Reports, Analytics, SEO, Appointments, Broadcast, Posts, AI Design, Build Page, Edit Page, Emails, Automations, My Agent, Help, Settings

### New Client Sidebar (5 items):

```
1. 🏠  ראשי        (Dashboard)     — Michael + metrics + recent leads
2. 🎯  לידים       (Leads)         — Full leads CRM page
3. 🌐  הדף שלי     (My Page)       — Page preview + editor + SEO + share links
4. 📢  שיווק       (Marketing)     — Broadcasts, social, emails, campaigns (tabs)
5. ⚙️  הגדרות      (Settings)      — Account, WhatsApp, branding, automations
```

**For Real Estate industry, add 1 conditional item:**
```
6. 🏠  נכסים       (Properties)    — Property listings (RE only)
```

### What goes under each item:

**1. Dashboard (ראשי)**
- Michael's greeting + chat input
- 4 quick-action cards
- Compact metrics strip (4 numbers)
- Recent leads table (5 rows)
- Onboarding checklist (until all 5 tasks complete, then disappears)

**2. Leads (לידים)**
- Full leads list with status pipeline
- Lead detail with timeline, notes
- Quick-status buttons (NEW → CONTACTED → WON)
- Manual follow-up actions

**3. My Page (הדף שלי)**
- Page preview (iframe)
- Page editor (block editor)
- Michael inline assistant (already exists as ClientPageAgent)
- SEO settings (moved from separate sidebar item)
- Share center (moved from dashboard)
- QR code, intake form link

**4. Marketing (שיווק)**
- Tab 1: Broadcasts (WhatsApp mass messaging)
- Tab 2: Social posts (create, schedule)
- Tab 3: Emails (templates, sequences)
- Tab 4: Campaigns (if any)

**5. Settings (הגדרות)**
- Account settings (branding, contact info)
- WhatsApp connection (Green API)
- Automations (workflow config)
- Help/documentation
- Portal password

### Admin Sidebar (separate, for agency owners):

```
1. 🏠  ראשי          (Dashboard)     — KPIs, client health, alerts
2. 👥  לקוחות        (Clients)       — All clients list + detail
3. 🎯  לידים         (Leads)         — Global leads view (ADD THIS — currently missing)
4. 🤖  סוכן AI       (AI Agent)      — Multi-client operations
5. 📊  דוחות         (Reports)       — Cross-client reports + lead scoring
6. 📢  שיווק         (Marketing)     — Templates, broadcasts, social, email
7. ⚙️  הגדרות        (Settings)      — Account, billing, system, offices
```

---

## 7. New Dashboard Structure

### Above the fold (what the user sees without scrolling):

```
┌─────────────────────────────────────────────────┐
│  Michael's Greeting                              │
│  "שלום [Name]! הגיעו 5 לידים חדשים השבוע..."    │
│                                                   │
│  [────── שאל את מיכאל... ──────] [🔵]            │
│                                                   │
│  [🌐 הדף שלי] [🎯 לידים] [📱 שלח הודעה] [📊 ביצועים] │
└─────────────────────────────────────────────────┘
┌──────────┬──────────┬──────────┬──────────┐
│ לידים    │ המרה     │ צפיות    │ פייפליין  │
│   12     │  15%     │  340     │  ₪12,500 │
└──────────┴──────────┴──────────┴──────────┘
```

### Below the fold (scroll to see):

```
┌─────────────────────────────────────────────────┐
│  לידים אחרונים (Recent Leads)                     │
│  ┌─────────────────────────────────────────────┐ │
│  │ David Cohen  |  054-XXX  |  Facebook  |  NEW │ │
│  │ Sarah Levi   |  052-XXX  |  Google    |  NEW │ │
│  │ Avi Ben      |  050-XXX  |  Organic   |  WON │ │
│  └─────────────────────────────────────────────┘ │
│  צפה בכל הלידים →                                 │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  ☑️ Onboarding checklist (until complete)         │
│  ✅ Build page  ☐ Connect WhatsApp  ☐ Share link │
└─────────────────────────────────────────────────┘
```

### What is REMOVED from dashboard:

| Removed | Reason |
|---------|--------|
| Welcome banner (dark gradient) | Replaced by Michael's greeting |
| 6 quick-action buttons | Replaced by 4 focused action cards |
| N8n automation hub | Technical, not user-facing |
| Pipeline banner (dark gradient) | Replaced by compact metrics strip |
| Lead sources chart | Available via Michael ("how am I doing?") |
| Activity feed | Low-value passive info |
| Share Center | Moved to "My Page" |
| Quick design controls | Moved to "My Page" |
| Setup progress bar | Removed (checklist is sufficient) |
| Performance section (4 mini-metrics) | Merged into compact strip |
| AI Recommendations | Merged into Michael's greeting |
| AI Agent card | Michael IS on the dashboard |
| AI Tools section | Accessible through Michael |
| Lead form link | Moved to "My Page" |

**Dashboard goes from 21 widgets to 4 zones:** Michael, metrics strip, recent leads, onboarding checklist.

---

## 8. AI Safety Rules

### Actions that MUST require confirmation:

| Action | Confirmation Message | Why |
|--------|---------------------|-----|
| PUBLISH | "הדף שלך יהיה נגיש לכולם באינטרנט. לפרסם?" | Makes content publicly visible |
| BROADCAST | "לשלוח את ההודעה ל-[X] נמענים?" + show message preview | Sends real messages to real people |
| BUILD_PAGE (when page already exists) | "יש לך כבר דף. להחליף אותו בדף חדש?" | Overwrites existing work |

### Actions that can run instantly (no confirmation):

| Action | Why Safe |
|--------|---------|
| BUILD_PAGE (first time, no existing page) | Nothing to overwrite |
| UPDATE_HERO / UPDATE_COLOR / UPDATE_TITLE / CHANGE_CTA / ADD_BLOCK / UPDATE_FEATURES | Modifies individual elements, not destructive |
| SHOW_STATS | Read-only |
| CREATE_REPORT | Creates data row, no external effect |
| GENERATE_POST (saves as DRAFT) | Must be published separately |
| WRITE_SCRIPT / SWOT | Text-only, no database effect |

### Actions that should NEVER auto-run:

| Action | Why |
|--------|-----|
| Delete lead / client / property | Irreversible data loss |
| Change account settings / password | Security-sensitive |
| Modify billing / subscription | Financial impact |
| Send email to external recipients | Cannot be unsent |
| Connect / disconnect integrations | Requires external credentials |

### Additional Safety Rules:

1. **Before BUILD_PAGE when page exists:** Save current `pageBlocks` to a `previousPageBlocks` field on the Client model (this enables undo). This is the single most important safety addition.

2. **Before BROADCAST:** Always show the exact message text AND recipient count. Never send without user seeing both.

3. **ADD_LEAD via AI:** Should run through the same validation as the regular lead creation API (duplicate detection, phone normalization). Currently bypasses it.

4. **Rate limit per action type:** In addition to the daily AI call limit (20 for BASIC), add per-action limits: max 3 BUILD_PAGE per day, max 5 BROADCAST per day. Prevents accidental loops.

5. **Action feedback must be human-readable:** Instead of "✅ Action: BUILD_PAGE" show "✅ I built your landing page! Here it is: [link]". The action labels already exist in ClientPageAgent.tsx — use those.

---

## 9. Simplification Strategy

### The simplification is NOT about removing features.

Every feature that exists today stays accessible. The simplification is about **layering:**

**Layer 1: Michael (visible on every page)**
The AI chat input appears at the top of the dashboard. Michael can: build pages, show stats, draft messages, create reports, generate posts. If the user can say it, Michael does it.

**Layer 2: 5 Sidebar Items (always visible)**
Dashboard, Leads, My Page, Marketing, Settings. These are the manual paths for actions the AI can't fully handle yet (lead status updates, detailed lead management, email sequence configuration, settings changes).

**Layer 3: Tabs Within Pages (one click deep)**
Marketing has 4 tabs (broadcasts, social, emails, campaigns). My Page has 3 zones (preview, editor, settings). Settings has 4 sections (account, WhatsApp, automations, help). These are power-user features that exist but don't clutter the main navigation.

**Layer 4: Features Accessible Only Through Michael**
AI Designer (image generation), performance summaries, SWOT analysis, sales scripts, follow-up message drafting. These work well through conversation and don't need their own pages.

### What changes for different user types:

**First-time user:**
- Sees Michael's greeting → tells Michael about their business → Michael builds page → user shares link → leads come in
- The sidebar exists but the user may never click it in the first session

**Daily returning user:**
- Opens dashboard → sees Michael's summary with lead count → clicks "Leads" to check new leads → asks Michael to draft a follow-up → approves broadcast
- Uses 2 sidebar items and Michael

**Power user / agency admin:**
- Uses full sidebar including Marketing tabs, detailed reports, lead scoring
- Uses Michael for content generation but manages clients/leads manually
- Accesses Settings > Automations for workflow configuration

### The transition path:

This is NOT a big-bang redesign. It's a 3-step transition:

**Step 1 (Week 1): Move Michael to the dashboard**
- Add the AI chat input + 4 action cards to the top of the portal dashboard page
- Keep everything else as-is (all 21 widgets still exist below)
- Add confirmation gates to PUBLISH and BROADCAST actions
- Save previousPageBlocks before BUILD_PAGE

**Step 2 (Week 2-3): Simplify the sidebar**
- Merge Build Page + Edit Page into "My Page"
- Merge Broadcast + Social + Emails into "Marketing"
- Hide Analytics, SEO, Automations, AI Designer, AI Agent, Help under their parent items
- Client sidebar: 17 items → 5-6 items

**Step 3 (Week 4): Clean the dashboard**
- Remove widgets that Michael replaces (pipeline banner, source chart, activity feed, AI recommendations, AI tools)
- Dashboard goes from 21 widgets to 4 zones
- Onboarding checklist disappears after all tasks complete

Each step delivers value independently. If Step 1 works, Step 2 is justified. If Step 2 works, Step 3 is safe.

---

*This blueprint uses only existing capabilities. No new APIs, models, or integrations are required. The changes are structural: what appears where, what the user sees first, and how Michael moves from a buried feature to the operating layer.*
