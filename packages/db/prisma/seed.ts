import { PrismaClient, UserRole, ClientPlan } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ── Wipe all data ──────────────────────────────────────────────────────────
  await prisma.messageTemplate.deleteMany();
  await prisma.systemSettings.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.report.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.landingPage.deleteMany();
  await prisma.intakeForm.deleteMany();
  await prisma.leadForm.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.propertyAlert.deleteMany();
  await prisma.propertyLead.deleteMany();
  await prisma.property.deleteMany();
  await prisma.abTestEvent.deleteMany();
  await prisma.emailSequenceLog.deleteMany();
  await prisma.emailSequence.deleteMany();
  await prisma.aiSuggestion.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.inboxEvent.deleteMany();
  await prisma.socialPost.deleteMany();
  await prisma.twoFactorSecret.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.broadcastLog.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.aiUsage.deleteMany();
  await prisma.campaignImage.deleteMany();
  await prisma.pageView.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.webhookLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.office.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  // Keep templates — they're static config
  // await prisma.template.deleteMany();

  // ── Super admin user ───────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email:               "admin@marketingos.local",
      passwordHash:        hashSync("admin123", 12),
      name:                "Super Admin",
      role:                UserRole.SUPER_ADMIN,
      isActive:            true,
      agencyPlan:          ClientPlan.AGENCY,
      onboardingCompleted: true,
    },
  });
  console.log("✓ Admin user:", admin.email, "/ password: admin123");

  // ── Demo template (keep it so landing pages work) ─────────────────────────
  await prisma.template.upsert({
    where:  { id: "template-default" },
    update: {},
    create: {
      id:          "template-default",
      name:        "Basic Lead Capture",
      description: "Simple hero + form layout",
      htmlContent: `<section class="hero" style="background:{{primaryColor}};padding:60px 20px;text-align:center">
  <h1 style="color:#fff;font-size:2rem;margin-bottom:12px">{{headline}}</h1>
  <p style="color:rgba(255,255,255,.8);font-size:1.1rem;margin-bottom:32px">{{subheadline}}</p>
</section>
<section style="max-width:480px;margin:40px auto;padding:0 20px">
  <form id="lead-form">
    <input name="firstName" placeholder="שם פרטי" required style="width:100%;padding:12px;margin-bottom:12px;border:1px solid #ddd;border-radius:8px;font-size:16px" />
    <input name="lastName"  placeholder="שם משפחה" required style="width:100%;padding:12px;margin-bottom:12px;border:1px solid #ddd;border-radius:8px;font-size:16px" />
    <input name="phone"     placeholder="טלפון" type="tel" required style="width:100%;padding:12px;margin-bottom:12px;border:1px solid #ddd;border-radius:8px;font-size:16px" dir="ltr" />
    <input name="email"     placeholder="אימייל" type="email" style="width:100%;padding:12px;margin-bottom:16px;border:1px solid #ddd;border-radius:8px;font-size:16px" dir="ltr" />
    <button type="submit" style="width:100%;padding:14px;background:{{primaryColor}};color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer">{{ctaText}}</button>
  </form>
</section>`,
      variables: [
        { key: "headline",     label: "כותרת ראשית",  type: "text",  defaultValue: "קבל הצעת מחיר חינם" },
        { key: "subheadline",  label: "כותרת משנה",   type: "text",  defaultValue: "מלא את הטופס ונחזור אליך תוך 24 שעות" },
        { key: "ctaText",      label: "טקסט כפתור",  type: "text",  defaultValue: "שלח פנייה" },
        { key: "primaryColor", label: "צבע ראשי",     type: "color", defaultValue: "#2563eb" },
      ],
    },
  });
  console.log("✓ Demo template ready");

  console.log("\nSeed complete. Login: admin@marketingos.local / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
