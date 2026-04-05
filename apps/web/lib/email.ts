import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL =
  process.env.RESEND_FROM || "MarketingOS <noreply@marketingos.co.il>";

export const EMAIL_TEMPLATES = {
  newLead: (data: {
    clientName: string;
    leadName: string;
    leadPhone: string;
    leadEmail?: string;
    source?: string;
  }) => ({
    subject: `🎯 ליד חדש — ${data.clientName}`,
    html: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;direction:rtl;background:#f9fafb;margin:0;padding:20px}
.card{background:white;border-radius:12px;padding:24px;max-width:500px;margin:0 auto;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
.header{background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;padding:16px;color:white;text-align:center;margin-bottom:20px}
.field{padding:10px 0;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between}
.label{color:#6b7280;font-size:13px}.value{font-weight:600;color:#111827}
.btn{display:block;text-align:center;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px}
.footer{text-align:center;font-size:11px;color:#9ca3af;margin-top:16px}
</style></head>
<body><div class="card">
<div class="header">
<div style="font-size:32px;margin-bottom:6px">🎯</div>
<div style="font-size:18px;font-weight:800">ליד חדש הגיע!</div>
<div style="opacity:0.85;font-size:13px">${data.clientName}</div>
</div>
<div class="field"><span class="label">שם</span><span class="value">${data.leadName}</span></div>
<div class="field"><span class="label">טלפון</span><span class="value" dir="ltr">${data.leadPhone}</span></div>
${data.leadEmail ? `<div class="field"><span class="label">מ��יל</span><span class="value" dir="ltr">${data.leadEmail}</span></div>` : ""}
<div class="field"><span class="label">מקור</span><span class="value">${data.source || "דף נחיתה"}</span></div>
<div class="field"><span class="label">זמן</span><span class="value">${new Date().toLocaleString("he-IL")}</span></div>
<a href="https://marketingos.co.il/admin/leads" class="btn">צפה בליד במערכת →</a>
<div class="footer">MarketingOS — מערכת שיווק חכמה</div>
</div></body></html>`,
  }),

  welcomeClient: (data: {
    clientName: string;
    portalUrl: string;
    portalPassword: string;
  }) => ({
    subject: "🎉 ברוך הבא ל-MarketingOS!",
    html: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;direction:rtl;background:#f9fafb;margin:0;padding:20px}
.card{background:white;border-radius:12px;padding:24px;max-width:500px;margin:0 auto}
.header{background:linear-gradient(135deg,#1e293b,#334155);border-radius:10px;padding:20px;color:white;text-align:center;margin-bottom:24px}
.step{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #f3f4f6}
.num{width:28px;height:28px;border-radius:50%;background:#6366f1;color:white;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px}
.cred{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin:16px 0}
.btn{display:block;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin:20px 0}
</style></head>
<body><div class="card">
<div class="header">
<div style="font-size:40px;margin-bottom:8px">🚀</div>
<div style="font-size:22px;font-weight:800">ברוך הבא, ${data.clientName}!</div>
<div style="opacity:0.8;margin-top:4px">המערכת שלך מוכנה</div>
</div>
<p style="color:#374151;line-height:1.7">חשבון MarketingOS שלך נוצר ומוכן לשימוש. הנה פרטי הכניסה לפורטל שלך:</p>
<div class="cred">
<div style="font-size:12px;color:#6b7280;margin-bottom:8px">פרטי כניסה לפורטל:</div>
<div style="margin-bottom:4px"><strong>כתובת:</strong> <span dir="ltr" style="color:#6366f1">${data.portalUrl}</span></div>
<div><strong>סיסמה:</strong> <span style="font-family:monospace;background:#eef2ff;padding:2px 8px;border-radius:4px">${data.portalPassword}</span></div>
</div>
<a href="${data.portalUrl}" class="btn">כנס לפורטל שלי →</a>
<div style="margin-top:20px">
<div style="font-weight:700;margin-bottom:12px">3 צעדים ראשונים:</div>
<div class="step"><div class="num">1</div><div><strong>בנה את הדף שלך</strong><br><span style="font-size:13px;color:#6b7280">לחץ "בנה דף" ועקוב אחרי 15 שאלות</span></div></div>
<div class="step"><div class="num">2</div><div><strong>חבר WhatsApp</strong><br><span style="font-size:13px;color:#6b7280">הגדרות → WhatsApp → green-api.com</span></div></div>
<div class="step"><div class="num">3</div><div><strong>שתף את הקישור</strong><br><span style="font-size:13px;color:#6b7280">שלח ללקוחות ותתחיל לקבל לידים!</span></div></div>
</div>
</div></body></html>`,
  }),

  weeklyReport: (data: {
    clientName: string;
    totalLeads: number;
    newLeads: number;
    closedLeads: number;
    conversionRate: number;
    topTip: string;
    portalUrl: string;
  }) => ({
    subject: `📊 דוח שבועי — ${data.clientName}`,
    html: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8">
<style>
body{font-family:Arial,sans-serif;direction:rtl;background:#f9fafb;margin:0;padding:20px}
.card{background:white;border-radius:12px;padding:24px;max-width:500px;margin:0 auto}
.stat{text-align:center;padding:14px;background:#f9fafb;border-radius:10px}
.stat-value{font-size:28px;font-weight:900;color:#6366f1}
.stat-label{font-size:12px;color:#6b7280;margin-top:2px}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:20px 0}
.tip{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px;margin:16px 0}
.btn{display:block;text-align:center;background:#6366f1;color:white;padding:12px;border-radius:8px;text-decoration:none;font-weight:700}
</style></head>
<body><div class="card">
<div style="text-align:center;margin-bottom:20px">
<div style="font-size:32px">📊</div>
<div style="font-size:18px;font-weight:800">הדוח השבועי שלך</div>
<div style="font-size:13px;color:#6b7280">${data.clientName} — ${new Date().toLocaleDateString("he-IL")}</div>
</div>
<div class="grid">
<div class="stat"><div class="stat-value">${data.newLeads}</div><div class="stat-label">לידים חדשים</div></div>
<div class="stat"><div class="stat-value">${data.closedLeads}</div><div class="stat-label">עסקאות סגורות</div></div>
<div class="stat"><div class="stat-value">${data.totalLeads}</div><div class="stat-label">סה"כ לידים</div></div>
<div class="stat"><div class="stat-value">${data.conversionRate}%</div><div class="stat-label">המרה</div></div>
</div>
<div class="tip"><strong>💡 טיפ השבוע ממיכאל:</strong><br><span style="font-size:13px">${data.topTip}</span></div>
<a href="${data.portalUrl}" class="btn">צפה בדוח המלא →</a>
</div></body></html>`,
  }),
};

export async function sendNewLeadEmail(
  to: string,
  data: Parameters<typeof EMAIL_TEMPLATES.newLead>[0]
) {
  const resend = getResend();
  if (!resend) return null;
  const template = EMAIL_TEMPLATES.newLead(data);
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendWelcomeEmail(
  to: string,
  data: Parameters<typeof EMAIL_TEMPLATES.welcomeClient>[0]
) {
  const resend = getResend();
  if (!resend) return null;
  const template = EMAIL_TEMPLATES.welcomeClient(data);
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendWeeklyReportEmail(
  to: string,
  data: Parameters<typeof EMAIL_TEMPLATES.weeklyReport>[0]
) {
  const resend = getResend();
  if (!resend) return null;
  const template = EMAIL_TEMPLATES.weeklyReport(data);
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: template.subject,
    html: template.html,
  });
}
