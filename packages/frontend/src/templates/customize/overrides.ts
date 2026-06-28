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

/** Build CSS rules that apply per-element style overrides via [data-edit] selectors. */
export function stylesToCss(styles?: Record<string, { color?: string; background?: string }>): string {
  if (!styles) return '';
  return Object.entries(styles)
    .map(([path, s]) => {
      const decls: string[] = [];
      if (s.color) decls.push(`color:${s.color} !important`);
      if (s.background) {
        decls.push(`background-color:${s.background} !important`);
        decls.push(`background-image:none !important`);
        decls.push(`border-color:${s.background} !important`);
      }
      if (!decls.length) return '';
      return `[data-edit="${path.replace(/"/g, '\\"')}"]{${decls.join(';')}}`;
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
  'night-shift': [
    { key: 'bg', label: 'Background', cssVar: '--ns-bg', default: '#0A0A0F' },
    { key: 'surface', label: 'Panels', cssVar: '--ns-panel', default: '#0B1020' },
    { key: 'text', label: 'Text', cssVar: '--ns-white', default: '#EAF2FF' },
    { key: 'accent', label: 'Neon accent', cssVar: '--ns-cyan', default: '#22D3EE' },
    { key: 'secondary', label: 'Neon secondary', cssVar: '--ns-magenta', default: '#F0398B' },
  ],
  prestige: [
    { key: 'bg', label: 'Background', cssVar: '--black', default: '#0C0C0C' },
    { key: 'surface', label: 'Surface', cssVar: '--charcoal', default: '#181818' },
    { key: 'text', label: 'Text', cssVar: '--cream', default: '#F5F1E8' },
    { key: 'accent', label: 'Gold accent', cssVar: '--gold', default: '#C9A24B' },
    { key: 'secondary', label: 'Secondary', cssVar: '--taupe', default: '#9B9183' },
  ],
  'full-throttle': [
    { key: 'bg', label: 'Background', cssVar: '--bg', default: '#F2F0E9' },
    { key: 'text', label: 'Text', cssVar: '--black', default: '#000000' },
    { key: 'accent', label: 'Accent', cssVar: '--blue', default: '#2D52FF' },
    { key: 'secondary', label: 'Secondary', cssVar: '--yellow', default: '#FFE600' },
    { key: 'alert', label: 'Alert', cssVar: '--red', default: '#FF3B30' },
  ],
  'easy-lane': [
    { key: 'bg', label: 'Background', cssVar: '--bg', default: '#FFFDFA' },
    { key: 'text', label: 'Text', cssVar: '--ink', default: '#243B53' },
    { key: 'accent', label: 'Accent', cssVar: '--blue', default: '#3B82F6' },
    { key: 'secondary', label: 'Secondary', cssVar: '--mint', default: '#34D399' },
    { key: 'highlight', label: 'Highlight', cssVar: '--peach', default: '#FFB088' },
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
