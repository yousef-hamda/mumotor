/**
 * Shared content contract for the standalone website templates.
 *
 * This is intentionally aligned with the backend's generated-site config
 * (`packages/backend/src/services/ai/generator.ts` + `templateBuilder.ts`) so a
 * template can later be ported into the deterministic HTML publish pipeline by
 * mapping `TemplateData` ⇆ `GeneratedSiteConfig`. Every template is a pure
 * function of `TemplateData` → JSX.
 */

export type Locale = 'en' | 'he' | 'ar';
export type Dir = 'ltr' | 'rtl';

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

export interface Package {
  id: string;
  name: string;
  /** Price in the site currency (whole units). */
  price: number;
  /** e.g. "/ lesson", "one-off". */
  unit?: string;
  lessons?: number;
  /** Lesson length in minutes. */
  duration?: number;
  features: string[];
  popular?: boolean;
  badge?: string;
}

export interface Review {
  id: string;
  name: string;
  /** 1–5. */
  rating: number;
  text: string;
  /** e.g. "Passed first time · Manual". */
  meta?: string;
  avatar?: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Area {
  name: string;
  note?: string;
}

export interface Hour {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

export interface TemplateData {
  business: {
    name: string;
    tagline: string;
    /** Short lettermark / wordmark text. */
    logoText: string;
    /** Optional uploaded logo image (data URL or URL). When absent, templates show the monogram. */
    logoSrc?: string;
  };
  instructor: {
    name: string;
    title: string;
    bio: string;
    photo: string;
    credentials: string[];
  };
  hero: {
    eyebrow: string;
    headline: string;
    sub: string;
    image: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  stats: StatItem[];
  packages: Package[];
  about: {
    heading: string;
    body: string[];
    image: string;
    checklist: string[];
  };
  areas: Area[];
  reviews: Review[];
  faqs: Faq[];
  gallery: string[];
  contact: {
    phone: string;
    email: string;
    address: string;
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    /** All social platforms the owner added: platform name -> URL. */
    socials?: Record<string, string>;
  };
  hours: Hour[];
  locale: Locale;
  dir: Dir;
  /** Real booking flow URL (set on the published site). Undefined in builder preview. */
  bookingUrl?: string;
  /** Real enrollment URL (set on the published site). */
  enrollUrl?: string;
  /** Lesson length in minutes (for any time copy). */
  classDuration?: number;
  /** Editable button labels (Customize mode). Falls back to per-template defaults. */
  labels?: TemplateLabels;
  /** CSS custom-property overrides applied to the template root (Customize colors). */
  theme?: Record<string, string>;
  /** Per-element style overrides keyed by data-edit path (Customize text + fill colour). */
  styles?: Record<string, { color?: string; background?: string }>;
  /**
   * Free-form text overrides for otherwise-hardcoded copy (section headings,
   * subtitles, etc.). Each template reads its own keys with a literal default,
   * e.g. `data.copy?.packagesHeading ?? 'Pick your lesson plan.'`, and tags the
   * element `data-edit="copy.packagesHeading"`. Lets Customize edit ANY text.
   */
  copy?: Record<string, string>;
  /**
   * Overridable icon slots: slot key -> lucide icon name (e.g. "Car", "Star").
   * Templates render prominent icons via `<DynamicIcon name={data.icons?.key ?? 'Check'} />`
   * tagged `data-edit="icons.key" data-edit-type="icon"`, so users can swap them
   * from the full lucide library in Customize.
   */
  icons?: Record<string, string>;
}

export interface TemplateLabels {
  /** Nav + hero primary "Book" button. */
  bookCta?: string;
  /** Package card CTA. */
  packageCta?: string;
  /** Package card CTA for the popular/featured plan. */
  packageCtaPopular?: string;
  /** Booking widget submit button. */
  bookingConfirm?: string;
}
