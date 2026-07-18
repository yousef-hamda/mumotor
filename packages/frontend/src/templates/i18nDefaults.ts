import { T } from './strings';
import type { Locale } from './types';
import type { Customization } from './customize/overrides';

/**
 * Per-locale sets of every machine-generated default UI string, across all
 * templates. Used to HEAL a stale Customize override that froze a default from
 * the WRONG language (e.g. an Arabic "Book now" left on a site later switched to
 * English) — the "Arabic button on an English site" bug. Prevention lives in
 * CustomizeMode (no-op edits are no longer committed); this repairs configs that
 * were polluted before that.
 *
 * Built once at module load by eagerly importing every `templates/<slug>/strings.ts`
 * (via import.meta.glob, so new templates are picked up automatically) plus the
 * shared base strings `T`.
 */
const modules = import.meta.glob('./*/strings.ts', { eager: true }) as Record<string, Record<string, unknown>>;

const LOCALES: Locale[] = ['en', 'he', 'ar'];

const DEFAULTS_BY_LOCALE: Record<Locale, Set<string>> = { en: new Set(), he: new Set(), ar: new Set() };

(function build() {
  const addAll = (loc: Locale, obj: unknown) => {
    if (obj && typeof obj === 'object') {
      for (const v of Object.values(obj as Record<string, unknown>)) {
        if (typeof v === 'string' && v.trim()) DEFAULTS_BY_LOCALE[loc].add(v.trim());
      }
    }
  };
  for (const loc of LOCALES) addAll(loc, T[loc]);
  for (const mod of Object.values(modules)) {
    for (const exp of Object.values(mod)) {
      if (typeof exp === 'function') {
        for (const loc of LOCALES) {
          try { addAll(loc, (exp as (l: Locale) => unknown)(loc)); } catch { /* not a strings getter */ }
        }
      }
    }
  }
})();

/**
 * True when `value` is a default string from a locale OTHER than `locale` and is
 * NOT also a valid default in `locale` — i.e. it's a wrong-language leftover, not
 * legitimate text (custom text, or a same-language default, is never flagged).
 */
function isForeignLocaleDefault(value: unknown, locale: Locale): boolean {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v) return false;
  const cur = DEFAULTS_BY_LOCALE[locale] ?? DEFAULTS_BY_LOCALE.en;
  if (cur.has(v)) return false; // valid in the site's own language → keep
  return LOCALES.some((l) => l !== locale && DEFAULTS_BY_LOCALE[l].has(v));
}

/**
 * Drop `labels.*` / `copy.*` overrides that are a default from a different
 * language than the site — so a switched language always wins for buttons, nav
 * links and headings. Genuine custom text and same-language defaults are kept.
 * No-op (returns the same object) when nothing needs healing.
 */
export function pruneForeignLocaleLabels(cz: Customization | undefined | null, locale: Locale): Customization | undefined | null {
  if (!cz || !cz.fields) return cz;
  let changed = false;
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cz.fields)) {
    if ((k.startsWith('labels.') || k.startsWith('copy.')) && isForeignLocaleDefault(v, locale)) { changed = true; continue; }
    fields[k] = v;
  }
  return changed ? { ...cz, fields } : cz;
}
