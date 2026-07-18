import type { TemplateData, Dir, Locale, Hour, Package, StatItem, Faq, Area, Review } from './types';
import { sampleData } from './sampleData';
import { EXPERIENCE_LEVELS, type PlanInput, type Transmission, type WizardConfig } from '../lib/wizard';
import { applyOverrides, type Customization } from './customize/overrides';
import { pruneForeignLocaleLabels } from './i18nDefaults';
import { dataDefaults, defaultFaqs, fmt, strings, weekdayName, type TemplateStrings } from './strings';

const WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const CUR = '₪';

const localeDir = (l: Locale): Dir => (l === 'he' || l === 'ar' ? 'rtl' : 'ltr');
const digits = (s?: string) => (s ? s.replace(/\D/g, '') : undefined);

/** Normalise a phone number into a wa.me-valid international number.
 *  Supports +<cc>, 00<cc>, and national 0-prefixed numbers (defaults to Israel 972). */
const waNumber = (s?: string): string | undefined => {
  if (!s) return undefined;
  let d = s.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '972' + d.slice(1);
  d = d.replace(/\D/g, '');
  return d.length >= 8 ? d : undefined;
};

function experienceMin(level: string): number {
  return EXPERIENCE_LEVELS.find((e) => e.value === level)?.min ?? 5;
}
function experienceLabel(s: TemplateStrings, level: string): string {
  return fmt(s.experienceYears, { n: experienceMin(level) });
}
function transmissionFeature(s: TemplateStrings, t: Transmission): string {
  return t === 'both' ? s.transmissionBoth : t === 'manual' ? s.transmissionManual : s.transmissionAutomatic;
}

/** Any auto-generated transmission feature line, across all locales/choices. A stored
 *  plan feature matching one of these is re-localized to the site's current locale +
 *  transmission (so a default plan seeded in English never leaks "Manual or automatic"
 *  onto an Arabic site, and switching to "automatic" updates the line). Custom feature
 *  text (not in this set) is left exactly as the teacher wrote it. */
const TRANSMISSION_PHRASES = new Set<string>([
  'Manual or automatic', 'Manual transmission', 'Automatic transmission',
  'ידני או אוטומט', 'רכב ידני', 'רכב אוטומטי',
  'يدوي أو أوتوماتيك', 'ناقل يدوي', 'ناقل أوتوماتيكي',
]);

/** Re-localize the English app-DEFAULT plan strings (the pre-filled single-lesson
 *  plan) so they render in the site language. EN output is unchanged because each
 *  localized EN value equals the English literal. Custom text is left untouched. */
function localizeDefaultPlanText(s: TemplateStrings, text: string): string {
  switch (text.trim()) {
    case 'Single lesson': return s.planSingleName;
    case '/ lesson': return s.planPerLessonUnit;
    case 'Door-to-door pickup': return s.planPickup;
    case 'No commitment': return s.planNoCommitment;
    default: return text;
  }
}

/** Use the teacher's own plans → packages (no invented offerings). */
function plansToPackages(s: TemplateStrings, plans: PlanInput[] | undefined, duration: number, price: number, transmission: Transmission): Package[] {
  // A DEFINED array (even empty) is authoritative — a teacher who deleted every
  // package gets no packages (the templates hide the section). Only a truly unset
  // plans list (undefined/null) falls back to the tasteful single-lesson starter (M9).
  const list = plans ? plans : [{ id: 'single', name: s.planSingleName, price: price || 0, unit: s.planPerLessonUnit, features: [transmissionFeature(s, transmission), s.planPickup, s.planNoCommitment] }];
  return list.map((pl) => ({
    id: pl.id,
    name: localizeDefaultPlanText(s, pl.name),
    price: pl.price,
    unit: pl.unit ? localizeDefaultPlanText(s, pl.unit) : pl.unit,
    duration,
    popular: pl.popular,
    badge: pl.popular ? s.badgePopular : undefined,
    features: (pl.features ?? [])
      .filter((f) => f.trim().length > 0)
      .map((f) => (TRANSMISSION_PHRASES.has(f.trim()) ? transmissionFeature(s, transmission) : localizeDefaultPlanText(s, f))),
  }));
}

/** The English pre-filled default tagline, localized. Only substituted when the
 *  teacher kept the exact default on a non-EN site (EN stays byte-identical). */
const DEFAULT_TAGLINE_EN = 'Your road to confidence';
const DEFAULT_TAGLINE: Record<Locale, string> = {
  en: 'Your road to confidence',
  he: 'הדרך שלך לביטחון בכביש',
  ar: 'طريقك إلى الثقة في القيادة',
};

/** Honest stats built only from data the owner actually entered. */
function buildStats(s: TemplateStrings, level: string, price: number, duration: number, daysPerWeek: number): StatItem[] {
  const out: StatItem[] = [{ label: s.statYears, value: experienceMin(level), suffix: '+' }];
  if (price) out.push({ label: s.statPerLesson, value: price, prefix: CUR });
  if (duration) out.push({ label: s.statMinutes, value: duration });
  if (daysPerWeek) out.push({ label: s.statDays, value: daysPerWeek });
  return out;
}

/** Join a street address + city WITHOUT duplicating the city when the address
 *  already contains it as a segment. Idempotent, so it also heals already-published
 *  sites whose stored contact.address was pre-combined ("…, Netanya, Netanya"). */
export function composeAddress(address: string, city: string): string {
  const a = (address || '').trim();
  const c = (city || '').trim();
  if (!c) return a;
  if (!a) return c;
  const segs = a.split(/[,/]/).map((p) => p.trim().toLowerCase());
  return segs.includes(c.toLowerCase()) ? a : `${a}, ${c}`;
}

function buildAreas(s: TemplateStrings, city: string, address: string): Area[] {
  const out: Area[] = [];
  if (city) out.push({ name: city, note: s.areaHomeBase }); // home base is the CITY, not the street
  // Any additional locality segments from the address (skip the numeric street line and the city itself).
  address
    .split(/[,/]/)
    .map((p) => p.trim())
    .filter((p) => p && !/\d/.test(p) && p.toLowerCase() !== city.toLowerCase())
    .slice(0, 2)
    .forEach((p) => out.push({ name: p }));
  out.push({ name: s.areaTestRoutes }, { name: s.areaEveningWeekend }, { name: s.areaPickup });
  const seen = new Set<string>();
  return out.filter((a) => { const k = a.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 6);
}

/** Localized coverage list used when the teacher entered no city/address
 *  (replaces the English `sampleData.areas` fallback). */
function defaultAreas(s: TemplateStrings): Area[] {
  return [{ name: s.areaTestRoutes }, { name: s.areaEveningWeekend }, { name: s.areaPickup }];
}

function hoursFromMap(map: Record<string, { isOpen?: boolean; open?: string; close?: string }>, locale: Locale): Hour[] {
  return WEEK.map((d) => {
    const h = map?.[d];
    const open = Boolean(h?.isOpen);
    return { day: weekdayName(locale, d), open: open ? h!.open ?? '' : '', close: open ? h!.close ?? '' : '', closed: !open };
  });
}

interface CoreInput {
  businessName: string;
  teacherName: string;
  tagline: string;
  description: string;
  experienceLevel: string;
  price: number;
  duration: number;
  daysPerWeek: number;
  transmission: Transmission;
  plans?: PlanInput[];
  phone: string;
  email: string;
  address: string;
  city: string;
  socialLinks: Record<string, string>;
  locale: Locale;
  logoSrc?: string;
  carPhoto?: string;
  instructorPhoto?: string;
  gallery: string[];
  hours: Hour[];
  bookingUrl?: string;
  enrollUrl?: string;
  accountUrl?: string;
  reviews?: Review[];
  customization?: Customization;
}

/** Shared builder: real data wins; demo defaults only fill what is genuinely empty. */
function buildTemplateData(c: CoreInput): TemplateData {
  const s = strings(c.locale);
  const d = dataDefaults(c.locale, c.transmission);
  const name = c.businessName || c.teacherName || 'Your Driving School';
  const teacher = c.teacherName || c.businessName || 'Your instructor';
  // If the teacher kept the exact English pre-filled default tagline on a HE/AR
  // site, localize it (EN is untouched); custom + empty taglines are unaffected.
  const tagline = c.tagline.trim() === DEFAULT_TAGLINE_EN && c.locale !== 'en' ? DEFAULT_TAGLINE[c.locale] : c.tagline;
  const area = c.city || c.address.split(/[,/]/)[0]?.trim() || '';
  const addressFull = composeAddress(c.address, c.city);
  const heroImg = c.carPhoto || c.gallery[0] || sampleData.hero.image;
  const aboutImg = c.gallery[1] || c.carPhoto || sampleData.about.image;

  // socials: raw map for `pick`, plus an ordered {platform,url} list the templates render.
  const socials = c.socialLinks || {};
  const pick = (k: string) => socials[k] || socials[k.toLowerCase()];
  const waNum = waNumber(c.phone) || waNumber(pick('WhatsApp'));
  const socialsList: { platform: string; url: string }[] = [
    ...(waNum ? [{ platform: 'whatsapp', url: `https://wa.me/${waNum}` }] : []),
    ...Object.entries(socials)
      .filter(([platform, url]) => url && !/whatsapp/i.test(platform))
      .map(([platform, url]) => ({ platform: platform.toLowerCase(), url })),
  ];

  const base: TemplateData = {
    ...sampleData,
    business: {
      name,
      tagline: tagline || s.taglineDefault,
      logoText: name,
      logoSrc: c.logoSrc || undefined,
    },
    instructor: {
      ...sampleData.instructor,
      name: teacher,
      title: `${s.instructorRole} · ${experienceLabel(s, c.experienceLevel)}`,
      bio: c.description || d.aboutBody[0],
      photo: c.instructorPhoto || sampleData.instructor.photo,
      credentials: d.credentials,
    },
    hero: {
      ...sampleData.hero,
      eyebrow: area ? fmt(s.heroEyebrowIn, { area }) : s.heroEyebrow,
      headline: tagline || s.heroHeadlineDefault,
      sub: c.description || fmt(area ? s.heroSubIn : s.heroSub, { teacher, area }),
      ctaPrimary: d.heroCtaPrimary,
      ctaSecondary: d.heroCtaSecondary,
      image: heroImg,
    },
    stats: buildStats(s, c.experienceLevel, c.price, c.duration, c.daysPerWeek),
    packages: plansToPackages(s, c.plans, c.duration, c.price, c.transmission),
    about: {
      ...sampleData.about,
      heading: d.aboutHeading,
      body: c.description ? [c.description, d.aboutBody[1]] : [...d.aboutBody],
      checklist: [...d.aboutChecklist],
      image: aboutImg,
    },
    areas: area ? buildAreas(s, c.city || area, addressFull) : defaultAreas(s),
    // Real approved reviews when provided; never fabricated (templates hide the empty section).
    reviews: c.reviews ?? [],
    faqs: defaultFaqs(c.locale, { price: c.price, duration: c.duration, area, transmission: c.transmission }),
    gallery: c.gallery,
    contact: {
      phone: c.phone || '',
      email: c.email || '',
      address: addressFull,
      // WhatsApp click-to-chat uses the teacher's phone (normalised to international).
      whatsapp: waNumber(c.phone) || waNumber(pick('WhatsApp')),
      instagram: pick('Instagram') || undefined,
      facebook: pick('Facebook') || undefined,
      socials: socialsList,
    },
    hours: c.hours,
    locale: c.locale,
    dir: localeDir(c.locale),
    classDuration: c.duration,
    bookingUrl: c.bookingUrl,
    enrollUrl: c.enrollUrl,
    accountUrl: c.accountUrl,
  };

  // Packages come from the teacher's plans (the wizard PlansEditor is the source of
  // truth). Drop a STALE Customize `packages` snapshot that no longer matches the
  // plans — that's what made a site show 3 duplicate cards while the wizard had 1
  // plan (a clone in Customize, then the plans were edited down). A same-length
  // override (legit inline text tweaks) is kept; style/theme overrides are always kept.
  // Heal any stale Customize override that froze a localized default (e.g. an
  // Arabic "Book now") so the site's chosen language always wins; then drop a
  // stale packages snapshot; then apply the rest.
  return applyOverrides(base, pruneForeignLocaleLabels(reconcilePackageOverride(c.customization, base.packages.length), c.locale));
}

/** Drop a Customize package-content override (`fields['packages']` / `fields['packages.N…']`)
 *  only when it STRUCTURALLY desyncs from the plans (different card count or an
 *  out-of-range index). Same-length overrides + all style/theme overrides are kept.
 *  This is a SAFETY NET — normally `syncPackageOverrideToPlans` folds edits into plans
 *  on save so no packages override survives. */
export function reconcilePackageOverride(c?: Customization | null, planCount = 0): Customization | null | undefined {
  if (!c?.fields) return c;
  const arr = c.fields['packages'];
  const lenMismatch = Array.isArray(arr) && arr.length !== planCount;
  const outOfRange = Object.keys(c.fields).some((k) => {
    const m = k.match(/^packages\.(\d+)/);
    return m && Number(m[1]) >= planCount;
  });
  if (!lenMismatch && !outOfRange) return c;
  const fields = Object.fromEntries(Object.entries(c.fields).filter(([k]) => !/^packages(\.|$)/.test(k)));
  return { ...c, fields };
}

/** Inverse of `plansToPackages`: turn a (possibly Customize-edited) packages array back
 *  into PlanInputs, dropping render-only fields (duration/badge). Lets Customize
 *  add/delete/rename/reorder sync INTO the wizard's plans. */
export function packagesToPlans(packages: Array<Partial<Package>> | undefined): PlanInput[] {
  if (!Array.isArray(packages)) return [];
  return packages.map((pk, i) => ({
    id: (typeof pk.id === 'string' && pk.id) || `plan-${i}`,
    name: typeof pk.name === 'string' ? pk.name : '',
    price: Number(pk.price) || 0,
    unit: typeof pk.unit === 'string' ? pk.unit : '',
    features: Array.isArray(pk.features) ? pk.features.filter((f): f is string => typeof f === 'string') : [],
    popular: !!pk.popular,
  }));
}

/** On save, fold any Customize `packages` override into `plans` and strip it, so `plans`
 *  stays the SINGLE source of truth and the two can never diverge (the 3-cards-vs-1 bug).
 *  If there's no packages override, plans + customization pass through untouched. */
export function syncPackageOverrideToPlans(
  c: Customization | null | undefined,
  currentPlans: PlanInput[] | undefined,
): { plans: PlanInput[] | undefined; customization: Customization | null | undefined } {
  const override = c?.fields?.['packages'];
  if (!Array.isArray(override)) return { plans: currentPlans, customization: c };
  const fields = Object.fromEntries(Object.entries(c!.fields!).filter(([k]) => !/^packages(\.|$)/.test(k)));
  return { plans: packagesToPlans(override as Array<Partial<Package>>), customization: { ...c!, fields } };
}

/** Builder wizard config → live TemplateData for preview & publish. */
export function wizardToTemplateData(w: WizardConfig): TemplateData {
  const locale = w.locale.toLowerCase() as Locale;
  const hours: Hour[] = WEEK.map((d) => {
    if (w.customHoursPerDay) {
      const ph = w.perDayHours[d];
      const open = ph && !ph.closed;
      return { day: weekdayName(locale, d), open: open ? ph.open : '', close: open ? ph.close : '', closed: !open };
    }
    const open = w.workingDays.includes(d);
    return { day: weekdayName(locale, d), open: open ? w.shiftStart : '', close: open ? w.shiftEnd : '', closed: !open };
  });
  const daysPerWeek = hours.filter((h) => !h.closed).length;

  return buildTemplateData({
    businessName: w.businessName,
    teacherName: w.teacherName,
    tagline: w.tagline,
    description: w.businessDescription,
    experienceLevel: w.experienceLevel,
    price: w.pricePerClass,
    duration: w.classDuration,
    daysPerWeek,
    transmission: w.transmission,
    plans: w.plans,
    phone: w.phone,
    email: w.email,
    address: w.address,
    city: w.city,
    socialLinks: (w.socialLinks as Record<string, string>) || {},
    locale,
    logoSrc: w.logoSrc,
    carPhoto: w.carPhoto,
    instructorPhoto: w.instructorPhoto,
    gallery: w.gallery || [],
    hours,
    customization: w.customization,
  });
}

/** The (extended) public-settings payload returned for a published site. */
export interface PublicSiteData {
  name: string;
  slug?: string | null;
  tagline?: string | null;
  teacherName?: string | null;
  bio?: string | null;
  pricePerClass?: number | null;
  classDuration?: number | null;
  experienceLevel?: string | null;
  transmission?: string | null;
  plans?: PlanInput[] | null;
  locale?: string | null;
  template?: string | null;
  logoSrc?: string | null;
  carPhoto?: string | null;
  instructorPhoto?: string | null;
  gallery?: string[] | null;
  city?: string | null;
  businessHours?: Record<string, { isOpen?: boolean; open?: string; close?: string }> | null;
  contact?: { phone?: string; email?: string; address?: string } | null;
  socialLinks?: Record<string, string> | null;
  customization?: Customization | null;
  reviews?: Review[] | null;
}

/** Published public-settings → TemplateData for the live React site. */
export function publicToTemplateData(p: PublicSiteData): TemplateData {
  const locale = (String(p.locale ?? 'en').toLowerCase() as Locale) || 'en';
  const hours = p.businessHours ? hoursFromMap(p.businessHours, locale) : sampleData.hours.map((h, i) => ({ ...h, day: weekdayName(locale, WEEK[i]) }));
  const daysPerWeek = hours.filter((h) => !h.closed).length;
  const slug = p.slug || undefined;
  return buildTemplateData({
    businessName: p.name,
    teacherName: p.teacherName || '',
    tagline: p.tagline || '',
    description: p.bio || '',
    experienceLevel: p.experienceLevel || '5-10',
    price: p.pricePerClass ?? 0,
    duration: p.classDuration ?? 45,
    daysPerWeek,
    transmission: (p.transmission as Transmission) || 'both',
    plans: p.plans || undefined,
    phone: p.contact?.phone || '',
    email: p.contact?.email || '',
    address: p.contact?.address || '',
    city: p.city || '',
    socialLinks: p.socialLinks || {},
    locale,
    logoSrc: p.logoSrc || undefined,
    carPhoto: p.carPhoto || undefined,
    instructorPhoto: p.instructorPhoto || undefined,
    gallery: p.gallery || [],
    hours,
    bookingUrl: slug ? `/p/${slug}/book-lesson` : undefined,
    enrollUrl: slug ? `/p/${slug}/enroll` : undefined,
    accountUrl: slug ? `/p/${slug}/account` : undefined,
    reviews: p.reviews || undefined,
    customization: p.customization || undefined,
  });
}
