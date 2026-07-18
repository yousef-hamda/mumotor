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
  meridian: { bg: '--mr-paper', ink: '--mr-ink', accent: '--mr-route', muted: '--mr-muted' },
  // --bz-face is the dial-panel colour; the booking shell paints on the CASE, so map
  // ink to --bz-ink (the warm off-white dial print) and bg to --bz-case.
  bezel: { bg: '--bz-case', ink: '--bz-ink', accent: '--bz-signal', muted: '--bz-muted' },
  solari: { bg: '--sl-board', ink: '--sl-text', accent: '--sl-amber', muted: '--sl-muted' },
  cadence: { bg: '--cd-paper', ink: '--cd-ink', accent: '--cd-accent', muted: '--cd-muted' },
  circuit: { bg: '--ci-carbon', ink: '--ci-ink', accent: '--ci-red', muted: '--ci-muted' },
  press: { bg: '--ps-paper', ink: '--ps-ink', accent: '--ps-accent', muted: '--ps-muted' },
  reel: { bg: '--rl-bg', ink: '--rl-ink', accent: '--rl-accent', muted: '--rl-muted' },
  slate: { bg: '--st-slate', ink: '--st-chalk', accent: '--st-accent', muted: '--st-muted' },
  folio: { bg: '--fo-paper', ink: '--fo-ink', accent: '--fo-accent', muted: '--fo-muted' },
  primary: { bg: '--pm-paper', ink: '--pm-ink', accent: '--pm-blue', muted: '--pm-muted' },
  gallery: { bg: '--ga-wall', ink: '--ga-ink', accent: '--ga-accent', muted: '--ga-muted' },
  gilt: { bg: '--gt-charcoal', ink: '--gt-ink', accent: '--gt-gold', muted: '--gt-muted' },
  sumi: { bg: '--su-paper', ink: '--su-ink', accent: '--su-vermilion', muted: '--su-muted' },
  obsidian: { bg: '--ob-bg', ink: '--ob-ink', accent: '--ob-accent' },
  'grid-ink': { bg: '--paper', ink: '--ink', accent: '--red', muted: '--grey' },
  'open-road': { bg: '--cream', ink: '--brown', accent: '--orange' },
  'easy-lane': { bg: '--bg', ink: '--ink', accent: '--blue' },
};

/** Google Fonts stylesheet per template (verbatim from each template's index.tsx). */
export const FONT_HREFS: Record<string, string> = {
  mumotor: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  meridian: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap',
  bezel: 'https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&family=Martian+Mono:wght@400;500;600;700&display=swap',
  solari: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap',
  circuit: 'https://fonts.googleapis.com/css2?family=Saira:wght@500;600;700;800&family=Chivo+Mono:wght@400;500;600&family=Public+Sans:wght@400;500;600;700&display=swap',
  press: 'https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Libre+Franklin:wght@400;500;600;700&display=swap',
  reel: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Overpass+Mono:wght@400;500;600&display=swap',
  slate: 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Caveat:wght@500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap',
  folio: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;0,6..96,700;0,6..96,800;1,6..96,400;1,6..96,500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap',
  primary: 'https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap',
  gallery: 'https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap',
  gilt: 'https://fonts.googleapis.com/css2?family=Marcellus&family=Outfit:wght@300;400;500;600;700&display=swap',
  cadence: 'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,slnt,wdth,wght@8..144,-10..0,75..125,100..1000&family=Red+Hat+Mono:wght@400;500;600&display=swap',
  sumi: 'https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@400;500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap',
  obsidian: 'https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap',
  'grid-ink': 'https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
  'open-road': 'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Merriweather:wght@300;400;700;900&display=swap',
  'easy-lane': 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap',
};

/** Heading typeface stack per template (registry `.font` + a safe fallback). */
const FONT_DISPLAY: Record<string, string> = {
  mumotor: "'Inter', system-ui, sans-serif",
  meridian: "'Instrument Serif', Georgia, serif",
  bezel: "'Familjen Grotesk', system-ui, sans-serif",
  solari: "'Oswald', system-ui, sans-serif",
  cadence: "'Roboto Flex', system-ui, sans-serif",
  circuit: "'Saira', system-ui, sans-serif",
  press: "'Libre Caslon Display', Georgia, serif",
  reel: "'Bebas Neue', system-ui, sans-serif",
  slate: "'Newsreader', Georgia, serif",
  folio: "'Bodoni Moda', Georgia, serif",
  primary: "'Jost', system-ui, sans-serif",
  gallery: "'Cormorant', Georgia, serif",
  gilt: "'Marcellus', Georgia, serif",
  sumi: "'Zen Old Mincho', Georgia, serif",
  obsidian: "'Manrope', system-ui, sans-serif",
  'grid-ink': "'Archivo', system-ui, sans-serif",
  'open-road': "'Abril Fatface', Georgia, serif",
  'easy-lane': "'Fredoka', system-ui, sans-serif",
};

/** Body typeface stack per template (kept clean + legible for forms). */
const FONT_BODY: Record<string, string> = {
  meridian: "'IBM Plex Sans', system-ui, sans-serif",
  bezel: "'Familjen Grotesk', system-ui, sans-serif",
  solari: "'Barlow', system-ui, sans-serif",
  cadence: "'Roboto Flex', system-ui, sans-serif",
  circuit: "'Public Sans', system-ui, sans-serif",
  press: "'Libre Franklin', system-ui, sans-serif",
  reel: "'DM Sans', system-ui, sans-serif",
  slate: "'Work Sans', system-ui, sans-serif",
  folio: "'DM Sans', system-ui, sans-serif",
  primary: "'Hanken Grotesk', system-ui, sans-serif",
  gilt: "'Outfit', system-ui, sans-serif",
  sumi: "'Zen Kaku Gothic New', system-ui, sans-serif",
  'open-road': "'Merriweather', Georgia, serif",
  'easy-lane': "'Nunito Sans', system-ui, sans-serif",
};
const DEFAULT_BODY = "-apple-system, 'Inter', system-ui, sans-serif";

/** Corner radius per template, matching each design's language. */
const RADII: Record<string, string> = {
  meridian: '2px',
  cadence: '2px',
  press: '3px',
  folio: '2px',
  primary: '2px',
  bezel: '10px',
  circuit: '10px',
  solari: '4px',
  reel: '4px',
  gallery: '4px',
  sumi: '4px',
  slate: '6px',
  gilt: '6px',
  'grid-ink': '3px',
  'open-road': '10px',
  obsidian: '14px',
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
