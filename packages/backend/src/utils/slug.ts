// Reserved host labels — a slug must never equal one (would collide with the
// app's own subdomains once wildcard DNS ships). Mirrors lib/tenant.ts.
const RESERVED = new Set(['www', 'app', 'api', 'mumotor', 'admin', 'staging', 'assets', 'static', 'site']);

// Hebrew → Latin (best-effort phonetic; final forms included).
const HE_MAP: Record<string, string> = {
  א: 'a', ב: 'b', ג: 'g', ד: 'd', ה: 'h', ו: 'v', ז: 'z', ח: 'h', ט: 't', י: 'y',
  כ: 'k', ך: 'k', ל: 'l', מ: 'm', ם: 'm', נ: 'n', ן: 'n', ס: 's', ע: 'a', פ: 'p',
  ף: 'p', צ: 'ts', ץ: 'ts', ק: 'k', ר: 'r', ש: 'sh', ת: 't',
};

// Arabic → Latin (best-effort phonetic).
const AR_MAP: Record<string, string> = {
  ا: 'a', أ: 'a', إ: 'i', آ: 'a', ء: 'a', ب: 'b', ت: 't', ث: 'th', ج: 'j', ح: 'h',
  خ: 'kh', د: 'd', ذ: 'dh', ر: 'r', ز: 'z', س: 's', ش: 'sh', ص: 's', ض: 'd', ط: 't',
  ظ: 'z', ع: 'a', غ: 'gh', ف: 'f', ق: 'q', ك: 'k', ل: 'l', م: 'm', ن: 'n', ه: 'h',
  و: 'w', ي: 'y', ى: 'a', ة: 'h', ؤ: 'w', ئ: 'y',
};

function transliterate(input: string): string {
  let out = '';
  for (const ch of input) out += HE_MAP[ch] ?? AR_MAP[ch] ?? ch;
  return out;
}

/**
 * Turn a business name into a URL slug. Hebrew/Arabic names are transliterated to
 * Latin first (so HE/AR-named sites get a real, brandable slug instead of all
 * collapsing to "driving-school"), Latin diacritics are stripped, and reserved
 * host labels are prefixed so they can never shadow the app's own subdomains.
 */
export function slugify(input: string): string {
  const latin = transliterate(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, ''); // strip combining diacritic marks
  let slug =
    latin
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'driving-school';
  if (RESERVED.has(slug)) slug = `my-${slug}`;
  return slug;
}
