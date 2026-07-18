import type { TemplateData } from '../types';

/**
 * A customization is a small, serializable overrides layer applied on top of a
 * base `TemplateData`. It is stored in the wizard config (pre-publish) and in
 * `website.configuration.customization` (post-publish), and produces the final
 * data the template renders.
 */
export interface Customization {
  /** dot-path into TemplateData -> override value (text, image url, label). */
  fields?: Record<string, unknown>;
  /** CSS custom-property -> value, applied to the template root. */
  theme?: Record<string, string>;
  /** data-edit path -> per-element style (text colour and/or button fill). */
  styles?: Record<string, { color?: string; background?: string }>;
}

export const EMPTY_CUSTOMIZATION: Customization = {};

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Read a dot-path (supports numeric array indices), e.g. "packages.0.name". */
export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

/** Immutably set a dot-path on a clone-safe object (creates intermediate objects). */
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const root = obj as Record<string, unknown>;
  let cur: Record<string, unknown> = root;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
  return obj;
}

/** Apply a customization over base data → the final data a template renders. */
export function applyOverrides(base: TemplateData, c?: Customization | null): TemplateData {
  if (!c || (!c.fields && !c.theme && !c.styles)) return base;
  const out = deepClone(base);
  if (c.fields) {
    for (const [path, value] of Object.entries(c.fields)) {
      if (value === undefined) continue;
      setPath(out, path, value);
    }
  }
  if (c.theme && Object.keys(c.theme).length) {
    out.theme = { ...(out.theme ?? {}), ...c.theme };
  }
  if (c.styles && Object.keys(c.styles).length) {
    out.styles = { ...(out.styles ?? {}), ...c.styles };
  }
  return out;
}

/** Has the user actually changed anything? */
export function isCustomized(c?: Customization | null): boolean {
  if (!c) return false;
  return Boolean(
    (c.fields && Object.keys(c.fields).length) ||
      (c.theme && Object.keys(c.theme).length) ||
      (c.styles && Object.keys(c.styles).length)
  );
}

/** Build CSS rules that apply per-element style overrides via [data-edit] selectors.
 *  This CSS is injected via a <style> tag on the PUBLIC site, so both the path
 *  and the values are strictly validated — otherwise stored customization data
 *  could break out of the style element (`</style><script>`) as XSS. */
const SAFE_EDIT_PATH = /^[\w.-]+$/; // e.g. "hero.headline", "packages.0.name"
const SAFE_CSS_COLOR = /^[#a-zA-Z0-9(),.%\s/-]+$/; // hex, rgb()/hsl(), named colours

function safeColor(value?: string): string | null {
  if (!value) return null;
  const v = value.trim();
  return v.length <= 64 && SAFE_CSS_COLOR.test(v) ? v : null;
}

export function stylesToCss(styles?: Record<string, { color?: string; background?: string }>): string {
  if (!styles) return '';
  return Object.entries(styles)
    .map(([path, s]) => {
      if (!SAFE_EDIT_PATH.test(path)) return '';
      const decls: string[] = [];
      const color = safeColor(s.color);
      const background = safeColor(s.background);
      if (color) decls.push(`color:${color} !important`);
      if (background) {
        decls.push(`background-color:${background} !important`);
        decls.push(`background-image:none !important`);
        decls.push(`border-color:${background} !important`);
      }
      if (!decls.length) return '';
      return `[data-edit="${path}"]{${decls.join(';')}}`;
    })
    .filter(Boolean)
    .join('\n');
}

/** Parse a list-item path like "packages.0.name" → {array,index,field}. */
export function parseListPath(path: string): { array: 'packages' | 'faqs' | 'areas' | 'stats'; index: number; field: string } | null {
  const m = /^(packages|faqs|areas|stats)\.(\d+)\.(\w+)$/.exec(path);
  if (!m) return null;
  return { array: m[1] as 'packages' | 'faqs' | 'areas' | 'stats', index: Number(m[2]), field: m[3] };
}

// ── Per-template colour slots ────────────────────────────────────────────────
// Each template paints from CSS custom properties on its root. These map a
// human "part" to the template's variable + its default value (so the colour
// picker shows the starting colour). Writing a slot sets `customization.theme`.

export interface ColorSlot {
  key: string;
  label: string;
  /** CSS variable name on the template root, e.g. "--red". */
  cssVar: string;
  /** Default value, for showing the current colour before any override. */
  default: string;
}

export const COLOR_SLOTS: Record<string, ColorSlot[]> = {
  mumotor: [
    { key: 'bg', label: 'Background', cssVar: '--mm-bg', default: '#FFFFFF' },
    { key: 'text', label: 'Text', cssVar: '--mm-ink', default: '#1D1D1F' },
    { key: 'accent', label: 'Accent', cssVar: '--mm-accent', default: '#0071E3' },
    { key: 'band', label: 'Section bands', cssVar: '--mm-band', default: '#F5F5F7' },
    { key: 'muted', label: 'Muted text', cssVar: '--mm-muted', default: '#6E6E73' },
  ],
  meridian: [
    { key: 'bg', label: 'Paper', cssVar: '--mr-paper', default: '#E6E7E0' },
    { key: 'text', label: 'Ink', cssVar: '--mr-ink', default: '#1A1F1D' },
    { key: 'accent', label: 'Route', cssVar: '--mr-route', default: '#B03060' },
    { key: 'line', label: 'Contours', cssVar: '--mr-contour', default: '#A8AC9E' },
    { key: 'secondary', label: 'Water', cssVar: '--mr-water', default: '#2E6E7E' },
  ],
  bezel: [
    { key: 'bg', label: 'Case', cssVar: '--bz-case', default: '#16181B' },
    { key: 'surface', label: 'Dial face', cssVar: '--bz-face', default: '#24272B' },
    { key: 'text', label: 'Text', cssVar: '--bz-ink', default: '#EDEBE6' },
    { key: 'accent', label: 'Needle', cssVar: '--bz-signal', default: '#E5484D' },
    { key: 'secondary', label: 'Metal', cssVar: '--bz-metal', default: '#8E9299' },
  ],
  solari: [
    { key: 'bg', label: 'Board', cssVar: '--sl-board', default: '#17140F' },
    { key: 'surface', label: 'Flap face', cssVar: '--sl-flap', default: '#221D16' },
    { key: 'text', label: 'Text', cssVar: '--sl-text', default: '#EDE7D8' },
    { key: 'accent', label: 'Amber', cssVar: '--sl-amber', default: '#F5A623' },
    { key: 'secondary', label: 'Brass', cssVar: '--sl-brass', default: '#8C7A4B' },
  ],
  cadence: [
    { key: 'bg', label: 'Paper', cssVar: '--cd-paper', default: '#F1EFE9' },
    { key: 'text', label: 'Ink', cssVar: '--cd-ink', default: '#141318' },
    { key: 'accent', label: 'Accent', cssVar: '--cd-accent', default: '#2E22CE' },
    { key: 'band', label: 'Section band', cssVar: '--cd-band', default: '#E4E1D8' },
    { key: 'muted', label: 'Muted text', cssVar: '--cd-muted', default: '#5A5852' },
  ],
  circuit: [
    { key: 'bg', label: 'Carbon', cssVar: '--ci-carbon', default: '#0C0D10' },
    { key: 'surface', label: 'Panels', cssVar: '--ci-panel', default: '#15171C' },
    { key: 'text', label: 'Text', cssVar: '--ci-ink', default: '#EDF1F5' },
    { key: 'accent', label: 'Racing red', cssVar: '--ci-red', default: '#FF2E3D' },
    { key: 'secondary', label: 'Timing green', cssVar: '--ci-green', default: '#37E07A' },
  ],
  press: [
    { key: 'bg', label: 'Paper', cssVar: '--ps-paper', default: '#F1EBDD' },
    { key: 'text', label: 'Ink', cssVar: '--ps-ink', default: '#1B1A18' },
    { key: 'accent', label: 'Ink colour', cssVar: '--ps-accent', default: '#1F4D3D' },
    { key: 'secondary', label: 'Copper', cssVar: '--ps-copper', default: '#A8763E' },
    { key: 'band', label: 'Section bands', cssVar: '--ps-band', default: '#E6DDC9' },
  ],
  reel: [
    { key: 'bg', label: 'Film black', cssVar: '--rl-bg', default: '#0B0B0D' },
    { key: 'surface', label: 'Mattes', cssVar: '--rl-panel', default: '#16161A' },
    { key: 'text', label: 'Text', cssVar: '--rl-ink', default: '#F4F1EA' },
    { key: 'accent', label: 'Vermilion', cssVar: '--rl-accent', default: '#E5533D' },
    { key: 'secondary', label: 'Film gold', cssVar: '--rl-gold', default: '#C9A24B' },
  ],
  slate: [
    { key: 'bg', label: 'Board', cssVar: '--st-slate', default: '#1E2622' },
    { key: 'surface', label: 'Panel', cssVar: '--st-panel', default: '#24302B' },
    { key: 'text', label: 'Chalk', cssVar: '--st-chalk', default: '#EDEAE0' },
    { key: 'accent', label: 'Coral chalk', cssVar: '--st-accent', default: '#E4897B' },
    { key: 'secondary', label: 'Sage chalk', cssVar: '--st-sage', default: '#A9C0A0' },
  ],
  primary: [
    { key: 'bg', label: 'Paper', cssVar: '--pm-paper', default: '#F0E9DA' },
    { key: 'text', label: 'Ink', cssVar: '--pm-ink', default: '#161514' },
    { key: 'accent', label: 'Blue', cssVar: '--pm-blue', default: '#2340D9' },
    { key: 'secondary', label: 'Red', cssVar: '--pm-red', default: '#DE3B26' },
    { key: 'highlight', label: 'Yellow', cssVar: '--pm-yellow', default: '#F2B705' },
  ],
  gallery: [
    { key: 'bg', label: 'Wall', cssVar: '--ga-wall', default: '#EEEAE1' },
    { key: 'text', label: 'Ink', cssVar: '--ga-ink', default: '#1C1A17' },
    { key: 'accent', label: 'Ochre', cssVar: '--ga-accent', default: '#B5662E' },
    { key: 'band', label: 'Floor band', cssVar: '--ga-band', default: '#E3DCCF' },
    { key: 'muted', label: 'Muted text', cssVar: '--ga-muted', default: '#635D52' },
  ],
  gilt: [
    { key: 'bg', label: 'Charcoal', cssVar: '--gt-charcoal', default: '#17161B' },
    { key: 'surface', label: 'Panels', cssVar: '--gt-panel', default: '#1F1E24' },
    { key: 'text', label: 'Text', cssVar: '--gt-ink', default: '#EFE9DD' },
    { key: 'accent', label: 'Gold', cssVar: '--gt-gold', default: '#C7A96B' },
    { key: 'secondary', label: 'Bronze', cssVar: '--gt-bronze', default: '#8A6E3C' },
  ],
  sumi: [
    { key: 'bg', label: 'Washi', cssVar: '--su-paper', default: '#F2EEE4' },
    { key: 'text', label: 'Ink', cssVar: '--su-ink', default: '#1A1815' },
    { key: 'accent', label: 'Vermilion', cssVar: '--su-vermilion', default: '#C4392E' },
    { key: 'secondary', label: 'Ink wash', cssVar: '--su-wash', default: '#8A857A' },
    { key: 'band', label: 'Section band', cssVar: '--su-band', default: '#E7E1D3' },
  ],
  atelier: [
    { key: 'bg', label: 'Paper', cssVar: '--at-paper', default: '#F6F1E6' },
    { key: 'text', label: 'Ink', cssVar: '--at-ink', default: '#241F1B' },
    { key: 'accent', label: 'Thread', cssVar: '--at-accent', default: '#A83F35' },
    { key: 'band', label: 'Section bands', cssVar: '--at-band', default: '#EFE6D3' },
    { key: 'secondary', label: 'Tape', cssVar: '--at-tape', default: '#7C5C34' },
  ],
  nocturne: [
    { key: 'bg', label: 'Midnight', cssVar: '--nc-bg', default: '#0A0E1E' },
    { key: 'text', label: 'Text', cssVar: '--nc-ink', default: '#F4F1E8' },
    { key: 'accent', label: 'Brass', cssVar: '--nc-accent', default: '#C9A227' },
    { key: 'surface', label: 'Panels', cssVar: '--nc-panel', default: '#121A33' },
    { key: 'secondary', label: 'Stars', cssVar: '--nc-star', default: '#8892B0' },
  ],
  deco: [
    { key: 'bg', label: 'Ivory', cssVar: '--dc-ivory', default: '#F6EEDD' },
    { key: 'text', label: 'Ink', cssVar: '--dc-ink', default: '#1C1B17' },
    { key: 'accent', label: 'Emerald', cssVar: '--dc-emerald', default: '#0F4C36' },
    { key: 'secondary', label: 'Gold', cssVar: '--dc-gold', default: '#C6A15B' },
    { key: 'band', label: 'Section bands', cssVar: '--dc-band', default: '#EFE3C8' },
  ],
  'grid-ink': [
    { key: 'bg', label: 'Background', cssVar: '--paper', default: '#FAFAF7' },
    { key: 'text', label: 'Text', cssVar: '--ink', default: '#111111' },
    { key: 'accent', label: 'Accent', cssVar: '--red', default: '#E4002B' },
    { key: 'muted', label: 'Muted text', cssVar: '--grey', default: '#6B6B6B' },
    { key: 'line', label: 'Lines', cssVar: '--line', default: '#E2E2DD' },
  ],
  'open-road': [
    { key: 'bg', label: 'Background', cssVar: '--cream', default: '#F4E9D8' },
    { key: 'text', label: 'Text', cssVar: '--brown', default: '#3A2A1E' },
    { key: 'accent', label: 'Accent', cssVar: '--orange', default: '#D2691E' },
    { key: 'secondary', label: 'Secondary', cssVar: '--teal', default: '#2A6F6B' },
    { key: 'highlight', label: 'Highlight', cssVar: '--mustard', default: '#E0A526' },
  ],
};

export function colorSlotsFor(slug: string): ColorSlot[] {
  return COLOR_SLOTS[slug] ?? [];
}

// ── Inspector sections (shared TemplateData shape) ───────────────────────────
// Drives the panel tabs so any part is reachable without clicking the canvas.

export interface EditField {
  path: string;
  label: string;
  kind: 'text' | 'multiline' | 'image';
}

export interface EditSection {
  id: string;
  label: string;
  fields: EditField[];
}

export const EDIT_SECTIONS: EditSection[] = [
  {
    id: 'branding',
    label: 'Branding',
    fields: [
      { path: 'business.name', label: 'Business name', kind: 'text' },
      { path: 'business.tagline', label: 'Tagline', kind: 'text' },
      { path: 'business.logoSrc', label: 'Logo', kind: 'image' },
    ],
  },
  {
    id: 'hero',
    label: 'Hero',
    fields: [
      { path: 'hero.eyebrow', label: 'Eyebrow', kind: 'text' },
      { path: 'hero.headline', label: 'Headline', kind: 'multiline' },
      { path: 'hero.sub', label: 'Subtitle', kind: 'multiline' },
      { path: 'hero.image', label: 'Hero photo', kind: 'image' },
      { path: 'hero.ctaPrimary', label: 'Primary button', kind: 'text' },
      { path: 'hero.ctaSecondary', label: 'Secondary button', kind: 'text' },
    ],
  },
  {
    id: 'about',
    label: 'About',
    fields: [
      { path: 'about.heading', label: 'About heading', kind: 'text' },
      { path: 'about.body.0', label: 'About paragraph', kind: 'multiline' },
      { path: 'about.image', label: 'About photo', kind: 'image' },
      { path: 'instructor.name', label: 'Instructor name', kind: 'text' },
      { path: 'instructor.photo', label: 'Instructor photo', kind: 'image' },
    ],
  },
  {
    id: 'labels',
    label: 'Buttons',
    fields: [
      { path: 'labels.bookCta', label: '"Book" button', kind: 'text' },
      { path: 'labels.packageCta', label: 'Package button', kind: 'text' },
      { path: 'labels.bookingConfirm', label: 'Confirm button', kind: 'text' },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    fields: [
      { path: 'contact.phone', label: 'Phone', kind: 'text' },
      { path: 'contact.email', label: 'Email', kind: 'text' },
      { path: 'contact.address', label: 'Address', kind: 'text' },
    ],
  },
];

/** The element type shown on the toolbar badge for a given data-edit-type. */
export type EditType = 'text' | 'image' | 'icon' | 'background';

export function fieldLabelFor(path: string): string {
  for (const s of EDIT_SECTIONS) {
    const f = s.fields.find((x) => x.path === path);
    if (f) return f.label;
  }
  // hero.image etc. fallbacks
  const last = path.split('.').slice(-1)[0];
  return last.charAt(0).toUpperCase() + last.slice(1);
}
