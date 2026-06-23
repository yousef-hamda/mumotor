// The 9 driving-teacher website presets. Each is a distinct, "quietly premium",
// light-themed design (palette + Google font pair + hero style + section order).

export interface PresetColors {
  primary: string;
  primaryDark: string;
  accent: string;
  bg: string;
  surface: string;
  fg: string;
  muted: string;
  border: string;
}

export interface Preset {
  id: string;
  label: string;
  description: string;
  colors: PresetColors;
  fonts: { heading: string; body: string; googleHref: string };
  hero: 'split' | 'center' | 'editorial' | 'overlay';
  sections: string[];
  bookingLayout: string;
}

const SECTIONS_DEFAULT = ['hero', 'stats', 'how', 'about', 'services', 'gallery', 'reviews', 'faq', 'contact', 'cta'];

function gfont(...families: string[]): string {
  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`;
}

export const DRIVING_PRESETS: Preset[] = [
  {
    id: 'clear-horizon',
    label: 'Clear Horizon',
    description: 'Crisp navy & white. Confident and modern.',
    colors: { primary: '#1e3a8a', primaryDark: '#172554', accent: '#2563eb', bg: '#ffffff', surface: '#f8fafc', fg: '#0f172a', muted: '#64748b', border: '#e2e8f0' },
    fonts: { heading: 'Plus Jakarta Sans', body: 'Inter', googleHref: gfont('Plus+Jakarta+Sans:wght@500;600;700;800', 'Inter:wght@400;500;600') },
    hero: 'split',
    sections: SECTIONS_DEFAULT,
    bookingLayout: 'classic',
  },
  {
    id: 'amber-signal',
    label: 'Amber Signal',
    description: 'Warm amber with an editorial serif headline.',
    colors: { primary: '#b45309', primaryDark: '#92400e', accent: '#f59e0b', bg: '#fffdf7', surface: '#fef6e7', fg: '#1c1917', muted: '#78716c', border: '#f0e6d2' },
    fonts: { heading: 'DM Serif Display', body: 'Inter', googleHref: gfont('DM+Serif+Display:ital@0;1', 'Inter:wght@400;500;600;700') },
    hero: 'editorial',
    sections: ['hero', 'stats', 'about', 'how', 'services', 'gallery', 'reviews', 'faq', 'contact', 'cta'],
    bookingLayout: 'card',
  },
  {
    id: 'pine-route',
    label: 'Pine Route',
    description: 'Fresh teal with a clean geometric sans.',
    colors: { primary: '#0f766e', primaryDark: '#115e59', accent: '#14b8a6', bg: '#ffffff', surface: '#f0fdfa', fg: '#042f2e', muted: '#5b7c79', border: '#cfeae6' },
    fonts: { heading: 'Sora', body: 'Inter', googleHref: gfont('Sora:wght@500;600;700;800', 'Inter:wght@400;500;600') },
    hero: 'center',
    sections: SECTIONS_DEFAULT,
    bookingLayout: 'floating',
  },
  {
    id: 'sand-dune',
    label: 'Sand Dune',
    description: 'Warm stone tones with a graceful serif.',
    colors: { primary: '#8a6f50', primaryDark: '#6b563d', accent: '#c2956a', bg: '#fbf7f0', surface: '#f5ecdf', fg: '#292018', muted: '#8c7d6b', border: '#e8dcc8' },
    fonts: { heading: 'Cormorant Garamond', body: 'Inter', googleHref: gfont('Cormorant+Garamond:wght@500;600;700', 'Inter:wght@400;500;600') },
    hero: 'split',
    sections: SECTIONS_DEFAULT,
    bookingLayout: 'split',
  },
  {
    id: 'open-road',
    label: 'Open Road',
    description: 'Steel blue, magazine-style editorial layout.',
    colors: { primary: '#334155', primaryDark: '#1e293b', accent: '#0ea5e9', bg: '#ffffff', surface: '#f1f5f9', fg: '#0f172a', muted: '#64748b', border: '#e2e8f0' },
    fonts: { heading: 'Outfit', body: 'Inter', googleHref: gfont('Outfit:wght@500;600;700;800', 'Inter:wght@400;500;600') },
    hero: 'editorial',
    sections: ['hero', 'about', 'stats', 'how', 'services', 'gallery', 'reviews', 'faq', 'contact', 'cta'],
    bookingLayout: 'tabs',
  },
  {
    id: 'graphite-road',
    label: 'Graphite Road',
    description: 'Monochrome charcoal. Minimal and sharp.',
    colors: { primary: '#18181b', primaryDark: '#09090b', accent: '#3f3f46', bg: '#ffffff', surface: '#fafafa', fg: '#18181b', muted: '#71717a', border: '#e4e4e7' },
    fonts: { heading: 'Space Grotesk', body: 'Inter', googleHref: gfont('Space+Grotesk:wght@500;600;700', 'Inter:wght@400;500;600') },
    hero: 'center',
    sections: SECTIONS_DEFAULT,
    bookingLayout: 'minimal',
  },
  {
    id: 'copper-lane',
    label: 'Copper Lane',
    description: 'Rich copper with a classic display serif.',
    colors: { primary: '#9a3412', primaryDark: '#7c2d12', accent: '#ea580c', bg: '#fffaf6', surface: '#fdeee3', fg: '#1c1410', muted: '#8b6f60', border: '#f0ddcd' },
    fonts: { heading: 'Playfair Display', body: 'Inter', googleHref: gfont('Playfair+Display:wght@500;600;700;800', 'Inter:wght@400;500;600') },
    hero: 'editorial',
    sections: SECTIONS_DEFAULT,
    bookingLayout: 'progress',
  },
  {
    id: 'mosaic-route',
    label: 'Mosaic Route',
    description: 'Earthy olive with a refined book serif.',
    colors: { primary: '#4d7c0f', primaryDark: '#3f6212', accent: '#84cc16', bg: '#ffffff', surface: '#f7fee7', fg: '#1a2e05', muted: '#65734b', border: '#dce8c4' },
    fonts: { heading: 'Libre Baskerville', body: 'Inter', googleHref: gfont('Libre+Baskerville:wght@400;700', 'Inter:wght@400;500;600') },
    hero: 'split',
    sections: SECTIONS_DEFAULT,
    bookingLayout: 'sidebar',
  },
  {
    id: 'burgundy-mile',
    label: 'Burgundy Mile',
    description: 'Deep burgundy with an elegant serif and soft mesh.',
    colors: { primary: '#881337', primaryDark: '#6b0f2a', accent: '#be123c', bg: '#fffafb', surface: '#fdf2f5', fg: '#1f0a12', muted: '#8b5a68', border: '#f3d9e1' },
    fonts: { heading: 'Cormorant Garamond', body: 'Inter', googleHref: gfont('Cormorant+Garamond:wght@500;600;700', 'Inter:wght@400;500;600') },
    hero: 'overlay',
    sections: SECTIONS_DEFAULT,
    bookingLayout: 'timeline',
  },
];

export function getPreset(id?: string | null): Preset {
  return DRIVING_PRESETS.find((p) => p.id === id) ?? DRIVING_PRESETS[0];
}

export const PRESET_SUMMARIES = DRIVING_PRESETS.map((p) => ({
  id: p.id,
  label: p.label,
  description: p.description,
  colors: p.colors,
  fonts: { heading: p.fonts.heading, body: p.fonts.body },
  hero: p.hero,
  bookingLayout: p.bookingLayout,
}));
