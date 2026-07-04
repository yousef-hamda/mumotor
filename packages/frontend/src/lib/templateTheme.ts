import { getTemplate, TEMPLATES } from '../templates/registry';

/**
 * Resolves any template's palette into a normalized `--book-*` token set that the
 * student-facing booking / enrollment / account pages paint from — so those pages
 * always MATCH the teacher's chosen template (colours, font, light/dark, radius),
 * even though they don't render the template component itself.
 *
 * The template's own CSS (mumotor.css etc.) is NOT loaded on these routes, so every
 * token must resolve to a concrete value (or a self-contained `color-mix` against the
 * other `--book-*` vars) — never a reference to a template-scoped var like `--mm-band`.
 */

export type Dir = 'ltr' | 'rtl';

/** Which of each template's CSS vars carry the bg / ink / accent / muted roles.
 *  (Only vars the teacher can actually recolour via Customize; see COLOR_SLOTS.) */
interface SlotMap {
  bg: string;
  ink: string;
  accent: string;
  muted?: string;
}

const SHELL_VARS: Record<string, SlotMap> = {
  mumotor: { bg: '--mm-bg', ink: '--mm-ink', accent: '--mm-accent', muted: '--mm-muted' },
  aurora: { bg: '--au-bg', ink: '--au-ink', accent: '--au-blue' },
  obsidian: { bg: '--ob-bg', ink: '--ob-ink', accent: '--ob-accent' },
  bento: { bg: '--bn-bg', ink: '--bn-ink', accent: '--bn-accent' },
  prism: { bg: '--pr-bg', ink: '--pr-ink', accent: '--pr-c1' },
  frosted: { bg: '--fr-bg', ink: '--fr-ink', accent: '--fr-accent' },
  'grid-ink': { bg: '--paper', ink: '--ink', accent: '--red', muted: '--grey' },
  'open-road': { bg: '--cream', ink: '--brown', accent: '--orange' },
  'night-shift': { bg: '--ns-bg', ink: '--ns-white', accent: '--ns-cyan' },
  prestige: { bg: '--black', ink: '--cream', accent: '--gold' },
  'full-throttle': { bg: '--bg', ink: '--black', accent: '--blue' },
  'easy-lane': { bg: '--bg', ink: '--ink', accent: '--blue' },
};

/** Google Fonts stylesheet per template (verbatim from each template's index.tsx). */
export const FONT_HREFS: Record<string, string> = {
  mumotor: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  aurora: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap',
  obsidian: 'https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap',
  bento: 'https://fonts.googleapis.com/css2?family=Figtree:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap',
  prism: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap',
  frosted: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap',
  'grid-ink': 'https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  'open-road': 'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Merriweather:wght@300;400;700;900&display=swap',
  'night-shift': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap',
  prestige: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@300;400;500;600&display=swap',
  'full-throttle': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Space+Mono:wght@400;700&display=swap',
  'easy-lane': 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap',
};

/** Heading typeface stack per template (registry `.font` + a safe fallback). */
const FONT_DISPLAY: Record<string, string> = {
  mumotor: "'Inter', system-ui, sans-serif",
  aurora: "'Sora', system-ui, sans-serif",
  obsidian: "'Manrope', system-ui, sans-serif",
  bento: "'Figtree', system-ui, sans-serif",
  prism: "'Bricolage Grotesque', system-ui, sans-serif",
  frosted: "'Fraunces', Georgia, serif",
  'grid-ink': "'Archivo', system-ui, sans-serif",
  'open-road': "'Abril Fatface', Georgia, serif",
  'night-shift': "'Space Grotesk', system-ui, sans-serif",
  prestige: "'Playfair Display', Georgia, serif",
  'full-throttle': "'Space Grotesk', system-ui, sans-serif",
  'easy-lane': "'Fredoka', system-ui, sans-serif",
};

/** Body typeface stack per template (kept clean + legible for forms). */
const FONT_BODY: Record<string, string> = {
  'open-road': "'Merriweather', Georgia, serif",
  'easy-lane': "'Nunito Sans', system-ui, sans-serif",
  'full-throttle': "'Space Mono', ui-monospace, monospace",
};
const DEFAULT_BODY = "-apple-system, 'Inter', system-ui, sans-serif";

/** Corner radius per template, matching each design's language. */
const RADII: Record<string, string> = {
  'full-throttle': '2px',
  'grid-ink': '3px',
  prestige: '3px',
  'open-road': '10px',
  'night-shift': '12px',
  prism: '14px',
  obsidian: '14px',
  bento: '16px',
  frosted: '16px',
  aurora: '18px',
  mumotor: '18px',
  'easy-lane': '22px',
};

/** Relative luminance of a #rrggbb / #rgb colour, or null if unparseable. */
function hexLuminance(hex: string): number | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export interface BookTheme {
  vars: Record<string, string>;
  isDark: boolean;
  fontHref: string;
}

/** Resolve a template slug + the teacher's chosen `customization.theme` into
 *  concrete `--book-*` CSS variables for the student-facing shell. */
export function resolveBookTheme(slugInput: string | undefined | null, theme?: Record<string, string> | null): BookTheme {
  const meta = getTemplate(slugInput ?? undefined) ?? TEMPLATES[0];
  const slug = meta.slug;
  const map = SHELL_VARS[slug] ?? SHELL_VARS.mumotor;
  const t = theme ?? {};

  const bg = t[map.bg] ?? meta.bg;
  const ink = t[map.ink] ?? meta.ink;
  const accent = t[map.accent] ?? meta.accent;

  // Prefer the resolved background's actual lightness (handles teacher overrides),
  // falling back to the registry's declared theme.
  const bgLum = hexLuminance(bg);
  const isDark = bgLum != null ? bgLum < 0.42 : meta.theme === 'dark';

  const accentLum = hexLuminance(accent);
  const accentInk = accentLum != null && accentLum > 0.6 ? '#141414' : '#ffffff';

  const surface = isDark
    ? 'color-mix(in srgb, var(--book-ink) 11%, var(--book-bg))'
    : '#ffffff';
  const muted = t[map.muted ?? ''] ?? 'color-mix(in srgb, var(--book-ink) 55%, var(--book-bg))';

  const vars: Record<string, string> = {
    '--book-bg': bg,
    '--book-ink': ink,
    '--book-accent': accent,
    '--book-accent-ink': accentInk,
    '--book-surface': surface,
    '--book-surface-2': isDark
      ? 'color-mix(in srgb, var(--book-ink) 6%, var(--book-bg))'
      : 'color-mix(in srgb, var(--book-ink) 4%, var(--book-bg))',
    '--book-line': 'color-mix(in srgb, var(--book-ink) 16%, transparent)',
    '--book-muted': muted,
    '--book-accent-soft': 'color-mix(in srgb, var(--book-accent) 12%, transparent)',
    '--book-radius': RADII[slug] ?? '14px',
    '--book-font': FONT_BODY[slug] ?? DEFAULT_BODY,
    '--book-font-display': FONT_DISPLAY[slug] ?? DEFAULT_BODY,
  };

  return { vars, isDark, fontHref: FONT_HREFS[slug] ?? FONT_HREFS.mumotor };
}

/** RTL for Hebrew/Arabic, else LTR. Accepts the backend Locale enum or lower-case. */
export function dirForLocale(locale?: string | null): Dir {
  const l = (locale ?? '').toUpperCase();
  return l === 'HE' || l === 'AR' ? 'rtl' : 'ltr';
}
