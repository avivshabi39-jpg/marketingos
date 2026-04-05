import { HDate, HebrewCalendar } from "@hebcal/core";

const HEBREW_MONTHS = ["תשרי", "חשון", "כסלו", "טבת", "שבט", "אדר", "אדר א׳", "אדר ב׳", "ניסן", "אייר", "סיון", "תמוז", "אב", "אלול"];

export interface HebrewHoliday { name: string; emoji: string; type: "holiday" | "fast" | "national" | "memorial"; color: string }

export function toGematria(num: number): string {
  if (num === 15) return "ט״ו";
  if (num === 16) return "ט״ז";
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל"];
  let r = "";
  if (num >= 10) { r += tens[Math.floor(num / 10)]; num %= 10; }
  if (num > 0) r += ones[num];
  return r.length === 1 ? r + "׳" : r.slice(0, -1) + "״" + r.slice(-1);
}

export function getHebrewDate(date: Date) {
  try {
    const hd = new HDate(date);
    return { day: toGematria(hd.getDate()), month: HEBREW_MONTHS[hd.getMonth() - 1] ?? "", isRC: hd.getDate() === 1 };
  } catch { return { day: "", month: "", isRC: false }; }
}

export function getHebrewMonthRange(date: Date): string {
  try {
    const f = new HDate(new Date(date.getFullYear(), date.getMonth(), 1));
    const l = new HDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    const fm = HEBREW_MONTHS[f.getMonth() - 1] ?? "";
    const lm = HEBREW_MONTHS[l.getMonth() - 1] ?? "";
    return fm === lm ? fm : `${fm} - ${lm}`;
  } catch { return ""; }
}

const HOLIDAY_MAP: Record<string, HebrewHoliday> = {
  "Rosh Hashana": { name: "ראש השנה", emoji: "🍎", type: "holiday", color: "#f59e0b" },
  "Yom Kippur": { name: "יום כיפור", emoji: "🕍", type: "fast", color: "#7c3aed" },
  "Sukkot": { name: "סוכות", emoji: "🌿", type: "holiday", color: "#22c55e" },
  "Shmini Atzeret": { name: "שמיני עצרת", emoji: "✡️", type: "holiday", color: "#f59e0b" },
  "Simchat Torah": { name: "שמחת תורה", emoji: "📜", type: "holiday", color: "#f59e0b" },
  "Pesach": { name: "פסח", emoji: "🍷", type: "holiday", color: "#f59e0b" },
  "Shavuot": { name: "שבועות", emoji: "📜", type: "holiday", color: "#f59e0b" },
  "Purim": { name: "פורים", emoji: "🎭", type: "holiday", color: "#ec4899" },
  "Yom HaShoah": { name: "יום השואה", emoji: "🕯️", type: "memorial", color: "#1e293b" },
  "Yom HaZikaron": { name: "יום הזיכרון", emoji: "🕯️", type: "memorial", color: "#374151" },
  "Yom HaAtzma'ut": { name: "יום העצמאות", emoji: "🇮🇱", type: "national", color: "#3b82f6" },
  "Lag BaOmer": { name: "ל״ג בעומר", emoji: "🔥", type: "holiday", color: "#f97316" },
  "Yom Yerushalayim": { name: "יום ירושלים", emoji: "🏛️", type: "national", color: "#3b82f6" },
  "Tu B'Av": { name: "ט״ו באב", emoji: "❤️", type: "holiday", color: "#ec4899" },
  "Tu BiShvat": { name: "ט״ו בשבט", emoji: "🌳", type: "holiday", color: "#22c55e" },
  "Tish'a B'Av": { name: "תשעה באב", emoji: "🕍", type: "fast", color: "#7c3aed" },
};

function mapHebcalEvent(desc: string): HebrewHoliday | null {
  if (HOLIDAY_MAP[desc]) return HOLIDAY_MAP[desc];
  for (const [key, val] of Object.entries(HOLIDAY_MAP)) { if (desc.includes(key)) return val; }
  if (desc.startsWith("Rosh Chodesh")) return { name: "ראש חודש", emoji: "🌙", type: "holiday", color: "#6366f1" };
  if (desc.includes("Chanukah")) return { name: "חנוכה", emoji: "🕎", type: "holiday", color: "#3b82f6" };
  if (desc.includes("Pesach")) return { name: desc.includes("CH''M") ? "חוה״מ פסח" : "פסח", emoji: "🍷", type: "holiday", color: desc.includes("CH''M") ? "#fcd34d" : "#f59e0b" };
  if (desc.includes("Sukkot") && desc.includes("CH''M")) return { name: "חוה״מ סוכות", emoji: "🌿", type: "holiday", color: "#86efac" };
  if (desc.includes("Hoshana")) return { name: "הושענא רבה", emoji: "🌿", type: "holiday", color: "#22c55e" };
  if (desc.includes("Shushan")) return { name: "שושן פורים", emoji: "🎭", type: "holiday", color: "#ec4899" };
  if (desc.includes("Esther")) return { name: "תענית אסתר", emoji: "✡️", type: "fast", color: "#6b7280" };
  if (desc.includes("Tammuz")) return { name: "צום י״ז בתמוז", emoji: "✡️", type: "fast", color: "#6b7280" };
  if (desc.includes("Gedaliah")) return { name: "צום גדליה", emoji: "✡️", type: "fast", color: "#6b7280" };
  if (desc.includes("Tevet")) return { name: "צום י׳ בטבת", emoji: "✡️", type: "fast", color: "#6b7280" };
  return null;
}

const calendarCache = new Map<number, { desc: string; greg: Date }[]>();
function getCalendarEvents(hYear: number) {
  if (calendarCache.has(hYear)) return calendarCache.get(hYear)!;
  try {
    const events = HebrewCalendar.calendar({ year: hYear, isHebrewYear: true, il: true });
    const mapped = events.map((ev) => ({ desc: ev.getDesc(), greg: ev.getDate().greg() }));
    calendarCache.set(hYear, mapped);
    return mapped;
  } catch { return []; }
}

export function getHolidaysForDate(date: Date): HebrewHoliday[] {
  try {
    const hd = new HDate(date);
    const events = getCalendarEvents(hd.getFullYear());
    const dateStr = date.toDateString();
    const results: HebrewHoliday[] = [];
    const seen = new Set<string>();
    for (const ev of events) {
      if (ev.greg.toDateString() === dateStr) {
        const mapped = mapHebcalEvent(ev.desc);
        if (mapped && !seen.has(mapped.name)) { results.push(mapped); seen.add(mapped.name); }
      }
    }
    return results;
  } catch { return []; }
}

export function getUpcomingHolidays(days: number) {
  const upcoming: { date: Date; holiday: HebrewHoliday; hebrew: ReturnType<typeof getHebrewDate> }[] = [];
  const today = new Date();
  const hYear = new HDate(today).getFullYear();
  const events = [...getCalendarEvents(hYear), ...getCalendarEvents(hYear + 1)];
  const seen = new Set<string>();
  for (const ev of events) {
    const diff = Math.floor((ev.greg.getTime() - today.getTime()) / 86400000);
    if (diff >= 0 && diff <= days) {
      const mapped = mapHebcalEvent(ev.desc);
      const key = `${ev.greg.toDateString()}-${mapped?.name}`;
      if (mapped && !seen.has(key)) { seen.add(key); upcoming.push({ date: ev.greg, holiday: mapped, hebrew: getHebrewDate(ev.greg) }); }
    }
  }
  return upcoming.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 10);
}
