# MarketingOS - Complete System Map

*Generated: April 8, 2026*

---

## 1. Executive Summary

MarketingOS is a Hebrew-first (RTL), multi-tenant SaaS platform built with Next.js 14 (App Router), Prisma ORM, and PostgreSQL. It serves marketing agencies managing multiple client businesses, with a specialized real-estate vertical.

**Scale of the system:**
- **84+ pages/routes** across admin, client portal, and public sections
- **150+ API endpoints** covering CRUD, AI generation, webhooks, and cron jobs
- **35 Prisma models** with complex relationships
- **79 UI components** (~25,000 lines) across admin, client, builder, and shared UI
- **20+ AI endpoints** powered by Claude for content generation
- **11 cron jobs** for automated reports, follow-ups, and maintenance
- **3 Inngest background workers** for async WhatsApp and broadcast processing

**Three main surfaces:**
1. **Admin Dashboard** (agency owner) - 60+ pages for managing clients, leads, campaigns, properties, billing
2. **Client Portal** (business owner) - 20+ pages for viewing leads, reports, building pages, sending broadcasts
3. **Public Pages** (visitors/leads) - Landing pages, property listings, intake forms

**Key integrations:** Stripe (billing), Green API (WhatsApp), Resend (email), n8n (automation), Cloudinary (images), Pollinations AI (image generation), Vercel Analytics.

---

## 2. Full System Inventory

### 2.1 Public Pages
| Item | Path | Purpose |
|------|------|---------|
| Homepage | `/` | Marketing site with features, pricing preview, CTAs |
| Pricing | `/pricing` | Plan comparison (Basic/Pro/Agency) with FAQs |
| Tenant Landing Page | `/[tenant]` | Client's generated landing page with blocks, A/B testing, WhatsApp widget |
| Tenant Sub-Page | `/[tenant]/[slug]` | Sub-page on client's landing site |
| Property Detail | `/[tenant]/property/[propertySlug]` | Real estate listing with gallery, agent info, contact form |
| Intake Form | `/[tenant]/intake` & `/intake/[slug]` | 12-step lead discovery questionnaire |
| Offline Page | `/offline` | PWA offline fallback |
| OG Image | `/api/og` | Dynamic Open Graph image generation |

### 2.2 Admin Dashboard Pages (60+)
**Auth:** `/admin/login`, `/admin/forgot-password`, `/admin/reset-password`, `/admin/onboarding`

**Core:**
- Dashboard (KPIs, charts, recent activity)
- Clients list + new client + client detail (tabbed: overview, leads, builder, campaigns, chatbot, google-ads, whitelabel, reviews, property-alerts)
- Leads list + new lead + lead detail (timeline, notes, activities)

**Marketing Tools:**
- Snapshots (industry templates)
- Social posts (scheduler)
- AI Designer (image generation)
- Broadcast (WhatsApp mass messaging)
- Email management + Email sequences (drip campaigns) + Email templates
- Campaigns

**Real Estate (Agency plan):**
- Properties list + new property
- Offices + office detail + agents
- Page builder per client

**Analytics & Reports:**
- Reports (weekly/monthly)
- Lead scoring
- AI Agent (conversational assistant)
- Appointments (calendar)
- Inbox (unified messages)

**Settings & System:**
- Settings + security (2FA)
- System health + system report
- Billing (Stripe integration)

### 2.3 Client Portal Pages (20+)
- Dashboard (leads, stats, page preview, onboarding checklist)
- Leads list
- Properties (real estate only) + new + edit
- Reports
- Analytics
- SEO & Google
- Appointments
- Broadcast
- Social posts
- AI Designer
- Build Page + Edit Page
- Emails
- Automations
- AI Agent ("Michael" - marketing consultant persona)
- Help
- Settings

### 2.4 Sidebars

**Admin Sidebar (4 groups, 16 items):**
1. My Clients: Dashboard, Clients, Messages, Appointments
2. Marketing Tools: Templates, Social, AI Designer, Broadcast, Emails
3. Reports & Analytics: Reports, Lead Scoring, AI Agent
4. Settings (collapsible): Settings, System, Billing, Offices (real estate only)

**Client Portal Sidebar (17 items):**
Dashboard, Leads, Properties (conditional), Reports, Analytics, SEO, Appointments, Broadcast, Posts, AI Designer, Build Page, Edit Page, Emails, Automations, My Agent, Help, Settings

### 2.5 Modals & Overlays
- Admin Command Palette (Cmd+K) - 17 commands
- Portal Command Palette (Cmd+K) - 12 commands
- Client SlideOver (side panel with client details)
- Campaign Quick Create modal
- Help Button modal (context-aware guides)
- ChatBot Widget (floating bottom-right)
- Live Chat / WhatsApp button (floating bottom-left)
- QR Code Panel
- Keyboard Shortcuts dialog

### 2.6 API Inventory (150+ routes)
- **Auth:** 8 routes (login, register, refresh, logout, forgot/reset password, 2FA setup/verify)
- **Client Auth:** 2 routes (portal login, password change)
- **Client Management:** 13 routes (CRUD + domain, whitelabel, chatbot, drip, onboarding)
- **Lead Management:** 13 routes (CRUD + stats, export, activities, notes, review)
- **Properties:** 11 routes (CRUD + stats, marketing log, broadcast, public view/whatsapp)
- **Property Alerts:** 4 routes (CRUD + broadcast)
- **Appointments:** 4 routes (CRUD)
- **Broadcasts:** 2 routes (list + send)
- **Email Sequences:** 4 routes (CRUD)
- **Email Templates:** 4 routes (CRUD)
- **AI Generation:** 14 routes (agent, stream, history, landing-page, property-description, social-post, email-template, seo-meta, whatsapp-message, followup, suggestions, campaign-image, generate-image, usage)
- **Reports:** 4 routes (generate, PDF export, send, chart data)
- **Social Posts:** 3 routes (CRUD + generate)
- **Billing:** 5 routes (subscription, checkout, portal, cancel, health)
- **User Management:** 6 routes (CRUD + me)
- **Offices:** 8 routes (CRUD + agents CRUD)
- **Notifications/Inbox:** 2 routes
- **Portal:** 3 routes (performance, pipeline-value, ai-recommendations)
- **Tracking:** 4 routes (track, ab-track, analytics, ab-results)
- **Webhooks:** 4 routes (Stripe, n8n, incoming, Facebook)
- **Cron Jobs:** 11 routes (reports, email-sequences, followups, whatsapp-drip, ai-suggestions, overnight-optimizer, auto-cleanup, backup, meta-token-refresh, weekly-agent-report, health-check)
- **Admin/System:** 4 routes (create-user, storage, cleanup, health)
- **Other:** intake forms, search, upload, settings, audit-logs, team, inngest, snapshots

### 2.7 Cron Jobs & Background Tasks
| Job | Schedule | Purpose |
|-----|----------|---------|
| Reports | Weekly (Mon 08:00) + Monthly (1st) | Generate lead reports, email to clients |
| WhatsApp Drip | Configurable | Day 1 + Day 3 follow-up sequences |
| Email Sequences | Periodic | Execute drip campaign steps based on triggers |
| Follow-ups | Periodic | Send WhatsApp/email follow-ups based on lead age |
| AI Suggestions | Periodic | Generate improvement recommendations |
| Overnight Optimizer | Nightly | Cleanup, indexing, cache refresh |
| Meta Token Refresh | Periodic | Refresh Facebook/Meta OAuth tokens |
| Backup | Periodic | Database backup to cloud storage |
| Auto-Cleanup | Periodic | Delete old records, clear logs |
| Health Check | Periodic | Monitor database, cache, external services |
| Weekly Agent Report | Weekly | Real estate agent summary reports |

### 2.8 Inngest Background Workers
1. **sendWhatsAppMessage** - Single WhatsApp message via Green API (20/min rate limit, 3 retries)
2. **sendBroadcast** - Batch WhatsApp to multiple leads (5/min rate limit, 2 retries)
3. **leadFollowup** - Delayed follow-up with configurable delay, respects lead status

---

## 3. Routes and Page Map

### A. OWNER / ADMIN DASHBOARD

| Route | Purpose | Who | Key Actions | Data Dependencies | Connects To |
|-------|---------|-----|-------------|-------------------|-------------|
| `/admin/dashboard` | Main overview | Admin | View KPIs, charts, recent activity | Clients, Leads, Reports | Client detail, Leads |
| `/admin/clients` | Client list | Admin | Search, filter, create client | Clients (with health scores) | Client detail, New client |
| `/admin/clients/new` | Create client | Admin | Fill form, set industry/plan | User (plan limits) | Client detail |
| `/admin/clients/[id]` | Client detail | Admin | View tabs, manage client | Client, Leads, LandingPage | Builder, Campaigns, Settings |
| `/admin/clients/[id]/overview` | Client summary | Admin | View stats, quick actions | Client, Leads, Reports | - |
| `/admin/clients/[id]/builder` | Page builder | Admin | AI questionnaire (13 steps), preview | Client.pageBlocks, AI | Landing page |
| `/admin/clients/[id]/builder/wizard` | Guided builder | Admin | Step-by-step page creation | Client answers → AI | Builder |
| `/admin/clients/[id]/campaigns` | Campaign mgmt | Admin | View/manage ad campaigns | Client, CampaignImage | Google/Facebook Ads |
| `/admin/clients/[id]/chatbot` | WhatsApp bot | Admin | Configure FAQ, schedule, greeting | Client.chatbot config | WhatsApp |
| `/admin/clients/[id]/google-ads` | Google Ads | Admin | View/manage Google campaigns | Client, external API | - |
| `/admin/clients/[id]/whitelabel` | Branding | Admin | Set logo, colors, domain | Client.whitelabel fields | Portal appearance |
| `/admin/clients/[id]/reviews` | Reviews | Admin | Manage client reviews | Client reviews data | - |
| `/admin/clients/[id]/property-alerts` | RE alerts | Admin (Agency) | Configure property match alerts | PropertyAlert, Property | Broadcasts |
| `/admin/leads` | Global leads | Admin | Filter, sort, search all leads | Lead (scoped to owner) | Lead detail |
| `/admin/leads/new` | Create lead | Admin | Manual lead entry | Client (for association) | Lead detail |
| `/admin/leads/[id]` | Lead detail | Admin | View timeline, add notes, change status | Lead, LeadActivity, Client | - |
| `/admin/campaigns` | All campaigns | Admin | View campaign list | Campaigns across clients | Client campaigns |
| `/admin/broadcast` | WhatsApp blast | Admin | Compose + send to lead segments | BroadcastLog, Lead phones | - |
| `/admin/email` | Email mgmt | Admin | Manage email communications | Email configs | Sequences, Templates |
| `/admin/email-sequences` | Drip campaigns | Admin | Create triggered email flows | EmailSequence, Lead triggers | - |
| `/admin/email-sequences/new` | New sequence | Admin | Set trigger, add steps with delays | EmailSequence | - |
| `/admin/email-sequences/[id]` | Edit sequence | Admin | Modify steps, toggle active | EmailSequence | - |
| `/admin/email-templates` | Email templates | Admin | Create reusable templates | EmailTemplate | Sequences |
| `/admin/workflows` | Automations | Admin | Create n8n workflows | Workflow, SystemSettings | n8n |
| `/admin/workflows/new` | New workflow | Admin | Define trigger, type, destination | Workflow | - |
| `/admin/social-posts` | Social scheduler | Admin | Create/schedule posts | SocialPost, AI | - |
| `/admin/ai-agent` | AI assistant | Admin | Chat with AI about clients | AiConversation, Client data | All modules |
| `/admin/ai-designer` | Image generator | Admin | Generate marketing images | CampaignImage, Pollinations | - |
| `/admin/reports` | Report list | Admin | View/generate/send reports | Report, Lead stats | PDF export, Email |
| `/admin/lead-scoring` | Lead quality | Admin | View scored leads | Lead.leadScore | Lead detail |
| `/admin/snapshots` | Templates | Admin | Apply industry snapshots | Client config presets | Client setup |
| `/admin/appointments` | Calendar | Admin | View/manage appointments | Appointment, Client, Lead | - |
| `/admin/inbox` | Unified inbox | Admin | Read messages from all channels | InboxEvent | Lead detail |
| `/admin/intake-forms` | Form manager | Admin | View all intake submissions | IntakeForm | Client intake |
| `/admin/intake-forms/[clientId]` | Client intake | Admin | View/edit client's form | IntakeForm | - |
| `/admin/properties` | Property list | Admin (Agency) | Manage real estate listings | Property | Property detail |
| `/admin/properties/new` | Add property | Admin (Agency) | Create listing with photos | Property, Client | - |
| `/admin/offices` | Office list | Admin (Agency) | Manage RE offices | Office | Office detail |
| `/admin/offices/[id]` | Office detail | Admin (Agency) | Manage agents in office | Office, Client (agents) | - |
| `/admin/page-builder/[clientId]` | RE page builder | Admin (Agency) | Build agent profile page | Client, pageBlocks | Landing page |
| `/admin/settings` | Account settings | Admin | Update profile, branding | User, SystemSettings | - |
| `/admin/settings/security` | Security | Admin | Enable 2FA, change password | TwoFactorSecret | - |
| `/admin/system` | System config | Super Admin | Manage API keys, storage | SystemSettings | - |
| `/admin/system-report` | System health | Super Admin | View diagnostics | All models (read-only) | - |
| `/admin/billing` | Billing | Admin | Manage Stripe subscription | Subscription | Stripe portal |

### B. CLIENT DASHBOARD

| Route | Purpose | Who | Key Actions | Data Dependencies | Connects To |
|-------|---------|-----|-------------|-------------------|-------------|
| `/client/[slug]` | Main dashboard | Client | View leads, stats, preview page | Client, Lead, Report | All portal pages |
| `/client/[slug]/leads` | My leads | Client | View/filter own leads | Lead (client-scoped) | - |
| `/client/[slug]/properties` | My properties | Client (RE) | Manage listings | Property | Edit property |
| `/client/[slug]/properties/new` | Add property | Client (RE) | Create new listing | Property | - |
| `/client/[slug]/properties/[id]/edit` | Edit property | Client (RE) | Update listing details | Property | - |
| `/client/[slug]/reports` | Reports | Client | View weekly/monthly reports | Report | - |
| `/client/[slug]/analytics` | Traffic data | Client | View source breakdown, trends | PageView, Lead | - |
| `/client/[slug]/seo` | SEO tools | Client | View/optimize SEO settings | Client SEO fields | - |
| `/client/[slug]/appointments` | Calendar | Client | Schedule/manage meetings | Appointment | - |
| `/client/[slug]/broadcast` | Broadcasts | Client | Send WhatsApp blasts | BroadcastLog, Lead | - |
| `/client/[slug]/social` | Social media | Client | Create/schedule posts | SocialPost | - |
| `/client/[slug]/ai-designer` | Image gen | Client | Generate marketing images | CampaignImage | - |
| `/client/[slug]/build-page` | Page builder | Client | Create landing page | Client.pageBlocks, AI | Edit page |
| `/client/[slug]/edit-page` | Edit page | Client | Modify existing page | Client.pageBlocks | - |
| `/client/[slug]/email` | Emails | Client | Email management | Email configs | - |
| `/client/[slug]/automations` | Automations | Client | View/manage automations | Workflow | - |
| `/client/[slug]/ai-agent` | AI consultant | Client | Chat with "Michael" | AiConversation, stats | All modules |
| `/client/[slug]/campaigns` | Campaigns | Client | View campaigns (read-only) | Campaign data | - |
| `/client/[slug]/help` | Help center | Client | View guides and docs | Static content | - |
| `/client/[slug]/settings` | Settings | Client | Update branding, contact | Client | - |

### C. PUBLIC LANDING PAGES / FORMS / PROPERTY PAGES

| Route | Purpose | Who | Data Dependencies |
|-------|---------|-----|-------------------|
| `/[tenant]` | Landing page | Public | Client.pageBlocks, pagePublished, abTestEnabled |
| `/[tenant]/[slug]` | Sub-page | Public | Client landing page data |
| `/[tenant]/property/[propertySlug]` | Property listing | Public | Property, Client (agent info) |
| `/[tenant]/intake` | Intake redirect | Public | Client.slug |
| `/intake/[slug]` | Discovery form | Public | IntakeForm config, Client |

### D. SYSTEM / AUTH / SETTINGS / ERROR

| Route | Purpose | Who |
|-------|---------|-----|
| `/admin/login` | Admin login | Public |
| `/admin/forgot-password` | Password reset request | Public |
| `/admin/reset-password` | Reset with token | Public |
| `/admin/onboarding` | New admin setup (3 steps) | Admin (first time) |
| `/client/login` | Global client login | Public |
| `/client/[slug]/login` | Branded client login | Public |
| `/admin/(protected)/error.tsx` | Error boundary | Admin |
| `/offline` | PWA offline page | Public |
| `/.well-known/security.txt` | Security policy | System |

---

## 4. Dashboard Separation Analysis

### What belongs ONLY to Admin:
- **Client management** (create, configure, delete clients)
- **Multi-client views** (see ALL clients, cross-client analytics)
- **Billing & subscription** management
- **System configuration** (API keys, storage, health monitoring)
- **User management** (create admin users, roles)
- **Office management** (real estate offices, agent assignments)
- **Intake form management** (view all submissions)
- **Email sequences configuration** (trigger-based drip creation)
- **Email template library**
- **Workflow/n8n configuration**
- **Lead scoring system**
- **Snapshots/industry templates**
- **System reports and diagnostics**
- **Security settings** (2FA management)
- **White-label configuration** per client

### What belongs ONLY to Client Portal:
- **Onboarding checklist** (setup progress tracking)
- **"Michael" AI persona** (personalized marketing consultant)
- **Branded login page** (client-specific colors/logo)
- **Help center** with guided tutorials
- **Share Center** (sharing links to landing page, intake form)
- **Setup Progress Bar** (visual onboarding completion)
- **Performance Section** with pipeline value
- **Password change** (client-specific auth)

### What should NEVER be shared:
- Admin should never see client's portal password or login as client
- Clients should never see other clients' data (multi-tenant isolation)
- Clients should never access billing, system settings, or user management
- Clients should never delete or create other clients
- Admin API keys and system credentials must stay in admin context only

### Duplicated Features (Admin + Client Portal):
| Feature | Admin Version | Client Version | Notes |
|---------|--------------|----------------|-------|
| AI Agent | Multi-client context, 7 categories | Single-client "Michael" persona | Different UX, same API backend |
| AI Designer | Admin image gen | Client image gen | Same functionality, same API |
| Broadcasts | Admin sends on behalf | Client sends own | Same API, different scoping |
| Social Posts | Cross-client management | Single-client | Same API |
| Analytics | Cross-client overview | Single-client view | Same data source |
| Page Builder | Admin builds for client | Client builds own | Similar but admin has wizard |
| Page Editor | Admin edits client pages | Client edits own | Same functionality |
| Appointments | Cross-client calendar | Single-client calendar | Same API |
| Properties | Admin manages all | Client manages own | Same API, different scope |
| Reports | Generate + send to clients | View received reports | Admin can generate; client views |
| Email | Admin email management | Client email management | Same feature |
| SEO | (Within client detail) | Dedicated SEO page | Client gets fuller SEO view |

### Visual Structure Assessment:
- **Admin sidebar has 16 items** - manageable but dense
- **Client sidebar has 17 items** - too many for a client-facing portal; likely overwhelms business owners
- The portal tries to expose nearly every admin feature to clients, which creates complexity
- Command palettes help with navigation but don't solve the density problem

---

## 5. Feature Groups

### Lead Management
- Lead creation (manual + form submission + property inquiry + Facebook webhook)
- Lead list with status pipeline (NEW → CONTACTED → QUALIFIED → PROPOSAL → WON → LOST)
- Lead detail with activity timeline
- Lead scoring (0-100, based on engagement signals)
- Lead notes and communication history
- Lead export (CSV/JSON)
- Duplicate detection (same phone within 30 days)
- UTM parameter tracking
- Honeypot bot protection
- Auto-reply via WhatsApp on new lead
- Lead follow-up scheduling (followUpAt)
- PropertyLead matching (ML-based score matching for real estate)

### Landing Pages
- AI-guided page builder (13-step questionnaire)
- Block-based renderer (10 block types: hero, text, image, form, features, whatsapp, cta, testimonial, gallery)
- Direct page editor (title, subtitle, CTA, color, logo)
- A/B testing (version A/B with 50/50 split, event tracking, winner selection)
- Page publishing toggle
- SEO metadata generation
- Custom domain support
- Responsive preview (desktop/mobile)
- Page view tracking with source detection

### AI Agent
- Admin multi-client agent (7 action categories, streaming responses)
- Client portal agent ("Michael" persona, 8 quick actions)
- AI-powered page building (action: BUILD_PAGE, UPDATE_HERO, ADD_BLOCK, etc.)
- Conversation history (AiConversation model)
- Proactive suggestions (AiSuggestion model)
- AI usage tracking (AiUsage - monthly token counts)
- AI content generation: landing pages, emails, social posts, WhatsApp messages, property descriptions, SEO meta, follow-ups, reply suggestions, chatbot FAQs, campaign images, weekly report summaries

### Scheduling / Meetings
- Appointment CRUD (PENDING → CONFIRMED → DONE → CANCELLED)
- Calendar view for admin and client
- Linked to leads and properties
- n8n webhook for appointment reminders (24h + 1h before)
- Notification on new appointment

### WhatsApp / Messaging
- Green API integration (instance ID + token)
- Setup wizard (admin + client portal versions)
- Auto-reply on new lead (with {name} placeholder)
- WhatsApp drip sequences (Day 1 + Day 3 messages)
- Broadcast to lead segments (all / new / contacted)
- Property broadcast (WhatsApp to matching property alert subscribers)
- Chatbot widget on landing pages
- WhatsApp click tracking on property pages
- AI-generated WhatsApp messages
- Rate-limited sending via Inngest workers

### Email / Notifications
- Email sequences with 3 triggers (new_lead, won_lead, no_reply_3days)
- Step builder with configurable delays (0-30 days)
- AI-generated email content per step
- Email template library (welcome, followup, report, property-alert, custom)
- Report delivery via email (Resend integration)
- In-app notifications (InboxEvent model)
- Push notifications (PushSubscription via web push)
- Notification bell with real-time polling (30s intervals)

### Analytics / Reports
- Weekly and monthly report generation (auto via cron)
- Report metrics: total leads, won/lost, conversion rate, top source, revenue
- PDF export
- Email delivery to clients
- AI-generated report summaries
- Page view tracking with source detection (UTM, Facebook, Google, referral, direct)
- A/B test event tracking and analysis
- Lead chart data (time-series trends)
- Client portal performance metrics (pipeline value, conversion rates)
- AI recommendations for optimization

### Real Estate / Properties
- Property CRUD (title, price, rooms, floor, area, city, neighborhood, type, images, features)
- Property types: APARTMENT, HOUSE, PENTHOUSE, GARDEN_APARTMENT, DUPLEX, STUDIO, COMMERCIAL, LAND
- Property status: AVAILABLE, UNDER_CONTRACT, SOLD, OFF_MARKET
- Public property detail page with photo gallery
- Agent profile page (AgentPageView for REAL_ESTATE industry)
- Property alerts (saved searches by budget, rooms, city)
- Property-to-lead matching (ML-based PropertyLead with matchScore)
- Property broadcast to matching alert subscribers
- Property view and WhatsApp click tracking
- AI-generated property descriptions
- Marketing log per property
- Exclusive/Featured property flags

### User Management / Multi-Tenant
- Roles: SUPER_ADMIN, ADMIN, AGENT
- SUPER_ADMIN sees all clients; others see owned clients only
- Scoped agents (clientId FK) see single client
- Client portal separate auth (password hash on Client model)
- JWT auth with httpOnly cookies (access 1h, refresh 30d)
- 2FA (TOTP) setup and verification
- Brute force protection (15-min lockout after 5 failures)
- Audit logging (AuditLog model with IP, user agent)
- Password reset flow with token
- Onboarding wizard for new admins (3 steps)
- Team members (TeamMember model with owner/member relationship)

### Billing / Payments
- Stripe integration (checkout sessions, customer portal)
- Plans: BASIC (40 clients), PRO (15 clients), AGENCY (unlimited)
- Subscription management (create, cancel, view)
- Webhook handling (checkout.session.completed, subscription.updated, invoice.payment_failed)
- Payment warning banner when past due
- Billing health check endpoint

### White Label / Branding
- Per-client: primary color, logo, portal name, welcome message, footer text
- Per-owner (agency-level): branding overrides cascading to clients
- Custom domain support with DNS verification
- Branded client login page
- CSS variable injection for dynamic theming
- Portal welcome banner and footer customization

### Infrastructure / Auth / APIs / Database
- **Stack:** Next.js 14 App Router, Prisma ORM, PostgreSQL (Docker), Tailwind CSS
- **Auth:** JWT via jose, bcryptjs, httpOnly cookies, 2FA via TOTP
- **Database:** 35 Prisma models, encrypted sensitive fields (AES)
- **External APIs:** Stripe, Green API, Resend, Cloudinary, Pollinations AI, n8n, Google Search Console
- **Background processing:** Inngest (WhatsApp sending, broadcasts, follow-ups)
- **Cron:** 11 scheduled jobs for reports, sequences, optimization, cleanup, backup
- **Webhooks:** Stripe, n8n, Facebook, incoming message handler
- **File upload:** Server-side with Cloudinary for images
- **PWA:** Service worker, offline page, install prompt
- **Performance:** Vercel Analytics, Speed Insights, dynamic imports, bundle optimization

---

## 6. End-to-End User Flows

### Flow 1: New Client Enters System
```
1. Admin logs in → /admin/dashboard
2. Clicks "New Client" → /admin/clients/new
3. Fills: name, slug, industry, email, phone, plan
4. POST /api/clients → creates Client record
   - Auto-applies industry snapshot if available
   - Sends welcome email
   - Plan limit check (BASIC=40, PRO=15, AGENCY=unlimited)
5. Redirected to /admin/clients/[id] → client detail page
6. Admin configures:
   - WhatsApp (Green API credentials)
   - White-label branding
   - Auto-reply template
7. Client receives portal login credentials
```

### Flow 2: Onboarding Starts
```
1. New admin → /admin/onboarding (3-step wizard)
   Step 1: Welcome message
   Step 2: Create first client (inline form)
   Step 3: Celebration + next-steps checklist
   - Links to: settings, clients, intake forms, dashboard

2. New client portal user → /client/[slug]/login
   - Branded login page (client colors/logo)
   - After login → dashboard with onboarding checklist
   - ChecklistCard tracks: WhatsApp setup, page build, first lead
   - SetupProgressBar shows completion %
   - OnboardingTour provides interactive walkthrough
```

### Flow 3: AI Helps Build Landing Page
```
1. Admin → /admin/clients/[id]/builder OR /admin/page-builder/[clientId]
2. AI questionnaire begins (13 steps):
   - Business description → Main service → Unique value
   - Target audience → Gender → Age → City
   - Customer problem → Solution → Price range
   - Urgency → Next action → Response SLA
   - (Optional) Testimonial + years in business
3. All answers submitted to /api/ai/full-page
4. Claude generates:
   - landingPageTitle, landingPageSubtitle
   - pageBlocks: array of block objects (hero, features, form, CTA, testimonials)
   - seoDescription
5. Preview renders in iframe (desktop/mobile toggle)
6. AI Agent sidebar available for refinements:
   - "Change the title" → UPDATE_HERO action
   - "Add testimonials" → ADD_BLOCK action
   - "Make it more professional" → style adjustments
7. Admin toggles pagePublished = true
8. Landing page live at /[client-slug]
```

### Flow 4: Lead Submits Form
```
1. Visitor arrives at /[tenant] landing page
2. A/B test: 50/50 split → version A or B (cookie-based)
3. AbTestEvent tracked (event: "view")
4. Visitor fills FormBlock (name, phone, email, message)
5. POST /api/leads creates Lead record:
   - Honeypot check (_hp field)
   - Duplicate detection (same phone within 30 days)
   - Auto-scoring (phone +20, email +15, UTM +10, metadata +5)
   - UTM parameters captured
   - AbTestEvent tracked (event: "submit")
```

### Flow 5: Lead Enters DB + Automations Trigger
```
1. Lead record created with status: NEW
2. LeadActivity created (type: "created")
3. InboxEvent created for admin notifications
4. Notification created for client dashboard
5. If autoReplyActive:
   - Inngest sendWhatsAppMessage event fired
   - Green API sends template message with {name} placeholder
   - Lead.autoReplied = true
6. If emailSequence with trigger "new_lead" exists:
   - First step sent immediately (delay=0)
   - Subsequent steps queued for cron execution
7. If n8nWebhookUrl configured:
   - Webhook fired to n8n with lead data
8. If client has webhookUrl configured:
   - Custom webhook fired with lead payload
```

### Flow 6: Lead Appears in CRM
```
Admin view:
1. /admin/leads shows new lead with NEW badge
2. NotificationBell shows unread notification
3. /admin/inbox shows new InboxEvent
4. Click lead → /admin/leads/[id]
5. View: contact info, source, score, timeline
6. Actions: change status, add note, request review

Client portal view:
1. /client/[slug] dashboard shows updated lead count
2. /client/[slug]/leads shows new lead in list
3. AI Agent "Michael" can discuss new leads when asked
```

### Flow 7: WhatsApp Response Triggered
```
1. Auto-reply already sent on lead creation (if configured)
2. Day 1 (24h later): Cron whatsapp-drip checks NEW leads
   - Sends follow-up message
   - Updates status: AUTO_REPLIED → CONTACTED
3. Day 3 (72h later): Cron checks CONTACTED leads
   - Sends reminder message
4. Admin can also:
   - Send manual WhatsApp from lead detail
   - Create broadcast to lead segments
   - Use AI to generate personalized messages
```

### Flow 8: Client Sees Report
```
1. Cron job runs Monday 08:00 (weekly) or 1st of month (monthly)
2. POST /api/cron/reports:
   - Aggregates: totalLeads, wonLeads, lostLeads, conversionRate, topSource, revenue
   - Creates Report record
   - Sends HTML email via Resend
   - AI generates summary of report highlights
3. Client views at /client/[slug]/reports
4. Admin views at /admin/reports (cross-client)
5. Admin can also: export PDF, email report manually
```

### Flow 9: Admin Sees User Activity
```
1. /admin/dashboard: KPI cards (clients, leads, revenue), charts
2. /admin/inbox: unified feed of all events
3. AuditLog tracks: login.success, client.create, lead.delete, etc.
4. /admin/system-report: system-wide diagnostics
5. Per-client analytics: /admin/clients/[id] overview tab
6. AI Agent can summarize activity on request
```

### Real Estate Flow:

### Flow 10: Agent Profile Page
```
1. Client with industry=REAL_ESTATE
2. Landing page at /[tenant] renders AgentPageView:
   - Agent bio, photo, contact info
   - Featured properties grid
   - Contact form
   - WhatsApp button
3. Property cards link to /[tenant]/property/[slug]
```

### Flow 11: Property Upload
```
1. Admin: /admin/properties/new OR Client: /client/[slug]/properties/new
2. Form: title, price, rooms, floor, area, city, neighborhood, type
3. Upload images (Cloudinary)
4. Optional: AI-generated description (/api/ai/property-description)
5. POST /api/properties creates Property record
6. Auto-matching: PropertyLead junction records created for matching leads
7. If PropertyAlert subscribers match: WhatsApp notification sent
```

### Flow 12: Property Listing Page
```
1. Public: /[tenant]/property/[propertySlug]
2. Displays: photo gallery with lightbox, specs grid, agent info
3. Lead capture form → creates Lead with propertyId
4. "Send to WhatsApp" button → tracks waClicks
5. Similar properties widget (3-5 matching listings)
6. Page view tracked via /api/public/properties/[id]/view
```

### Flow 13: Sold Property → Performance
```
1. Admin/Client updates property status: AVAILABLE → SOLD
2. Property.soldAt timestamp set
3. Appears in agent performance metrics
4. Closed leads associated via PropertyLead
5. Revenue tracked in reports
6. AI Agent can summarize agent performance
```

### Flow 14: AI-Assisted Property Creation
```
1. User enters basic property details (address, rooms, price)
2. Clicks "Generate Description" → /api/ai/property-description
3. Claude generates Hebrew listing description with:
   - Neighborhood highlights
   - Property features emphasis
   - Emotional selling points
4. User reviews, edits, publishes
5. Optional: generate campaign image via /admin/ai-designer
6. Broadcast to matching subscribers
```

---

## 7. Visual Complexity / UX Problems

### What Looks Overloaded:
1. **Client Portal Sidebar (17 items)** - Business owners see Dashboard, Leads, Properties, Reports, Analytics, SEO, Appointments, Broadcast, Posts, AI Designer, Build Page, Edit Page, Emails, Automations, My Agent, Help, Settings. This is an admin-level menu exposed to non-technical users.

2. **Admin Client Detail Page** - Has 10+ tabs (overview, leads, builder, campaigns, chatbot, google-ads, whitelabel, reviews, property-alerts) all at the same hierarchy level. Finding the right tab requires scanning.

3. **Admin Marketing Tools Group** - Templates, Social, AI Designer, Broadcast, Emails are five separate menu items that could be grouped under a single "Marketing" hub.

### What Is Visually Confusing:
1. **Two Page Builders** - "Build Page" and "Edit Page" as separate menu items in client portal. Users don't know which to use. The admin has a third builder at `/admin/page-builder/[clientId]` and a fourth at `/admin/clients/[id]/builder`.

2. **AI Agent vs AI Designer** - Both are "AI" features but serve completely different purposes (chat assistant vs image generation). The naming doesn't clarify the distinction.

3. **Duplicate Navigation Paths** - Both admin and client can access broadcasts, social posts, analytics, appointments, emails, and properties. The admin version has more power but the routing and naming are inconsistent.

4. **Admin Sidebar "Templates" → Snapshots** - Menu says "Templates" (תבניות) but routes to `/admin/snapshots`. This naming mismatch creates confusion about what snapshots are.

### What Should Be Hidden from Users:
1. **Client Portal:** Automations, SEO (technical), Email management - these are advanced features most business owners won't use and should be progressive disclosure or hidden behind "Advanced" section.

2. **Admin:** System, System Report - only relevant for SUPER_ADMIN. Already partially hidden but still in sidebar for all admins.

3. **Client Portal:** Build Page + Edit Page should be a single "My Page" entry that shows the builder if no page exists, or the editor if one does.

### What Should Be Simplified:
1. **Email ecosystem** - There are 3 separate routes: `/admin/email`, `/admin/email-sequences`, `/admin/email-templates`. These could be tabs within a single Email hub.

2. **Client Portal navigation** - 17 items should be reduced to ~8-10 with secondary items accessible via the command palette or settings.

3. **Reporting** - Reports, Lead Scoring, and Analytics all show overlapping data in different views. A unified "Insights" page would be cleaner.

### What Should Become AI-Led Instead of Manual:
1. **Email sequences** - Instead of manually building drip campaigns, the AI could generate complete sequences based on industry and trigger type.

2. **Social posts** - Already has AI generation, but the scheduling and platform selection could be fully automated based on client industry patterns.

3. **Lead follow-up** - The AI Agent already suggests actions but can't auto-execute. Proactive follow-ups could be auto-sent with client approval.

4. **Report interpretation** - Reports are generated automatically but clients need to understand them. The AI Agent could proactively explain report highlights in the dashboard.

---

## 8. Hidden Risks / Unknown Areas

### Unclear Modules:
1. **Inngest integration** - The `/api/inngest` route exists but the full extent of Inngest functions (beyond the 3 documented) is not immediately visible. Background task failures may be silent.

2. **n8n integration depth** - N8nDashboard shows 4 pre-built workflows, but the actual n8n instance configuration and webhook reliability is external to the app. If n8n goes down, automation fails silently.

3. **Facebook webhook handler** - The `/api/webhooks/facebook` route handles Lead Ads but the verification flow and token management is fragile (depends on meta-token-refresh cron).

4. **Client portal auth model** - Client auth is a simple password hash on the Client model, not a separate User record. This means no audit trail for client login sessions, no client-level 2FA, and password resets go through admin.

### Hidden Dependencies:
1. **Green API** (WhatsApp) - External service that the entire WhatsApp flow depends on. No fallback if Green API is down. Rate limits are handled by Inngest but errors may not surface clearly.

2. **Resend** (email) - All transactional email depends on Resend. API key stored in SystemSettings per user, meaning each admin needs their own key.

3. **Cloudinary** - Image uploads and campaign images depend on Cloudinary. URL references in the database will break if the Cloudinary account changes.

4. **Pollinations AI** - Image generation depends on this free service. No SLA, potential for service interruption.

5. **Stripe** - Billing webhook must be correctly configured. If webhook fails, subscription status in DB diverges from Stripe reality.

6. **Claude API** - All AI features depend on Anthropic's API. Token usage tracked per user but no hard spending cap in code (only rate limiting).

### Missing Documentation:
1. No API documentation (OpenAPI/Swagger) for the 150+ endpoints
2. No data dictionary for the 35 Prisma models
3. No deployment runbook (environment variables, secrets, external service setup)
4. No architecture diagram
5. No onboarding guide for new developers

### Where Bugs Are Likely:
1. **Multi-tenant data leakage** - With 150+ endpoints, each needs proper ownership checks. Any missing `where: { ownerId }` clause could leak data between tenants.

2. **Cron job reliability** - 11 cron jobs all protected by CRON_SECRET header, but failure notifications are unclear. A failed report cron means clients don't get weekly reports with no alert.

3. **A/B test state** - When a winner is selected, pageBlocks is overwritten. If the process fails mid-way, the client could end up with corrupted page state.

4. **Email sequence execution** - The cron checks trigger conditions but the delay calculation depends on lead creation time. Edge cases around timezone differences could cause premature or delayed sends.

5. **Encrypted fields** - Facebook tokens, Green API tokens, and n8n URLs are AES-encrypted. Key management and rotation strategy is not visible.

6. **File upload cleanup** - CampaignImage and Property images are uploaded to Cloudinary but the auto-cleanup cron's behavior regarding orphaned images is unclear.

7. **Race conditions in broadcasts** - If two admins trigger broadcasts simultaneously for the same client, leads could receive duplicate messages.

8. **Portal session management** - Client portal uses a separate token system. Token expiration and refresh behavior may differ from admin JWT flow.

---

## 9. Recommendations for Clearer Structure

### Navigation Restructuring:

**Admin Sidebar (reduce from 16 to 12 items):**
1. Dashboard
2. Clients
3. Leads
4. Inbox
5. Appointments
6. Marketing (hub: social, broadcast, email, campaigns, AI designer, snapshots)
7. Reports & Analytics (hub: reports, lead scoring)
8. AI Agent
9. Properties (Agency only)
10. Offices (Agency only)
11. Settings (expandable: account, security, billing, system)

**Client Portal Sidebar (reduce from 17 to 9 items):**
1. Dashboard (with onboarding checklist integrated)
2. Leads
3. My Page (combined build/edit, shows builder if no page, editor if page exists)
4. Properties (RE only)
5. Reports & Analytics (combined)
6. Marketing (hub: broadcast, social, email)
7. Appointments
8. AI Agent
9. Settings (with help accessible inside)

### Feature Consolidation:
1. **Merge Build Page + Edit Page** into a single "My Page" route in client portal
2. **Merge Email + Email Sequences + Email Templates** into a single "Email" hub with tabs
3. **Merge Reports + Lead Scoring + Analytics** into an "Insights" hub
4. **Rename AI Designer** to "Image Creator" or "Marketing Images" for clarity
5. **Rename Snapshots/Templates** to consistently use one term ("Quick Start Templates")

### Data Architecture Improvements:
1. Add a dedicated `ClientUser` model for portal authentication (separate from the Client model)
2. Add webhook delivery status tracking with retry UI
3. Add cron job execution logs visible in the admin system dashboard
4. Add explicit AI spending limits per user/plan (not just rate limiting)

### Progressive Disclosure for Client Portal:
1. **Primary:** Dashboard, Leads, My Page, Reports
2. **Secondary (expandable):** Analytics, Appointments, Broadcast, AI Agent
3. **Advanced (hidden by default):** Automations, SEO, Email, Social

### Consistency Fixes:
1. Standardize route naming: `/admin/email-sequences` vs `/admin/email-templates` vs `/admin/email` should all live under `/admin/email/*`
2. Client portal routes should mirror admin structure where features overlap
3. API routes should follow RESTful conventions consistently (some use GET for mutations)
4. All forms should use consistent validation patterns and error display

---

*This document maps the current state of MarketingOS as of April 2026. It should be updated as the system evolves.*
