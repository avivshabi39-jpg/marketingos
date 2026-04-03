import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(text: string): string {
  const translitMap: Record<string, string> = {
    'א':'a','ב':'b','ג':'g','ד':'d','ה':'h','ו':'v',
    'ז':'z','ח':'ch','ט':'t','י':'y','כ':'k','ך':'k',
    'ל':'l','מ':'m','ם':'m','נ':'n','ן':'n','ס':'s',
    'ע':'e','פ':'p','ף':'p','צ':'tz','ץ':'tz','ק':'k',
    'ר':'r','ש':'sh','ת':'t',
  };
  const transliterated = text.split('').map(c => translitMap[c] ?? c).join('');
  const slug = transliterated
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `client-${Math.random().toString(36).slice(2, 9)}`;
}

export function paginate<T>(items: T[], page: number, perPage = 20) {
  const total = items.length;
  const totalPages = Math.ceil(total / perPage);
  const data = items.slice((page - 1) * perPage, page * perPage);
  return { data, total, totalPages, page };
}
