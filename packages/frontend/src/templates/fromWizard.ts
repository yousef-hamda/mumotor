import type { TemplateData, Dir, Locale, Hour, Package, StatItem, Faq, Area, Review } from './types';
import { sampleData } from './sampleData';
import { EXPERIENCE_LEVELS, transmissionFeature, type PlanInput, type Transmission, type WizardConfig } from '../lib/wizard';
import { applyOverrides, type Customization } from './customize/overrides';

const WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const CUR = '₪';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
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
function experienceLabel(level: string): string {
  return EXPERIENCE_LEVELS.find((e) => e.value === level)?.label ?? '5+ years';
}

/** Use the teacher's own plans → packages (no invented offerings). */
function plansToPackages(plans: PlanInput[] | undefined, duration: number, price: number, transmission: Transmission): Package[] {
  const list = plans && plans.length ? plans : [{ id: 'single', name: 'Single lesson', price: price || 0, unit: '/ lesson', features: [transmissionFeature(transmission), 'Door-to-door pickup', 'No commitment'] }];
  return list.map((pl) => ({
    id: pl.id,
    name: pl.name,
    price: pl.price,
    unit: pl.unit,
    duration,
    popular: pl.popular,
    badge: pl.popular ? 'Most popular' : undefined,
    features: (pl.features ?? []).filter((f) => f.trim().length > 0),
  }));
}

function transmissionFaq(t: Transmission): Faq {
  if (t === 'manual') return { q: 'Do you teach manual or automatic?', a: 'Manual lessons — you’ll master full clutch control in a dual-control manual car.' };
  if (t === 'automatic') return { q: 'Do you teach manual or automatic?', a: 'Automatic lessons — relaxed, no-clutch learning in a dual-control automatic car.' };
  return { q: 'Do you teach manual and automatic?', a: 'Both — tell us which you prefer when you book and we’ll match you to the right dual-control car.' };
}

/** Honest stats built only from data the owner actually entered. */
function buildStats(level: string, price: number, duration: number, daysPerWeek: number): StatItem[] {
  const out: StatItem[] = [{ label: 'Years of experience', value: experienceMin(level), suffix: '+' }];
  if (price) out.push({ label: 'Per lesson', value: price, prefix: CUR });
  if (duration) out.push({ label: 'Minutes a lesson', value: duration });
  if (daysPerWeek) out.push({ label: 'Days a week', value: daysPerWeek });
  return out;
}

function buildFaqs(price: number, duration: number, area: string, transmission: Transmission): Faq[] {
  const where = area ? `${area} and the surrounding area` : 'the local area';
  return [
    transmissionFaq(transmission),
    { q: 'How much is a lesson?', a: `Lessons are ${CUR}${price || 0} for ${duration || 45} minutes, with multi-lesson plans that work out cheaper per hour.` },
    { q: 'Which areas do you cover?', a: `We cover ${where}, with door-to-door pickup from home, work or college.` },
    { q: 'How quickly can I start?', a: 'Most new learners are on the road within a few days of booking — we confirm your first slot by text.' },
    { q: 'What if I need to reschedule?', a: 'You can reschedule free up to 24 hours before your lesson.' },
  ];
}

function buildAreas(address: string): Area[] {
  const parts = address.split(/[,/]/).map((s) => s.trim()).filter(Boolean);
  const out: Area[] = [];
  if (parts.length) out.push({ name: parts[0], note: 'Home base' });
  parts.slice(1, 3).forEach((p) => out.push({ name: p }));
  out.push({ name: 'Test-centre routes' }, { name: 'Evening & weekend slots' }, { name: 'Pickup on request' });
  return out.slice(0, 6);
}

function hoursFromMap(map: Record<string, { isOpen?: boolean; open?: string; close?: string }>): Hour[] {
  return WEEK.map((d) => {
    const h = map?.[d];
    const open = Boolean(h?.isOpen);
    return { day: title(d), open: open ? h!.open ?? '' : '', close: open ? h!.close ?? '' : '', closed: !open };
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
  reviews?: Review[];
  customization?: Customization;
}

/** Shared builder: real data wins; demo defaults only fill what is genuinely empty. */
function buildTemplateData(c: CoreInput): TemplateData {
  const name = c.businessName || c.teacherName || 'Your Driving School';
  const teacher = c.teacherName || c.businessName || 'Your instructor';
  const area = c.city || c.address.split(/[,/]/)[0]?.trim() || '';
  const addressFull = [c.address, c.city].filter(Boolean).join(', ');
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
      tagline: c.tagline || 'Pass first time, drive for life.',
      logoText: name,
      logoSrc: c.logoSrc || undefined,
    },
    instructor: {
      ...sampleData.instructor,
      name: teacher,
      title: `Driving instructor · ${experienceLabel(c.experienceLevel)}`,
      bio: c.description || sampleData.instructor.bio,
      photo: c.instructorPhoto || sampleData.instructor.photo,
    },
    hero: {
      ...sampleData.hero,
      eyebrow: area ? `Driving lessons in ${area}` : 'Driving lessons',
      headline: c.tagline || sampleData.hero.headline,
      sub: c.description || `One-to-one lessons with ${teacher}${area ? ` across ${area}` : ''}. Book your first lesson in under a minute.`,
      image: heroImg,
    },
    stats: buildStats(c.experienceLevel, c.price, c.duration, c.daysPerWeek),
    packages: plansToPackages(c.plans, c.duration, c.price, c.transmission),
    about: {
      ...sampleData.about,
      body: c.description ? [c.description, sampleData.about.body[1]] : sampleData.about.body,
      image: aboutImg,
    },
    areas: area ? buildAreas(addressFull) : sampleData.areas,
    // Real approved reviews when provided; never fabricated (templates hide the empty section).
    reviews: c.reviews ?? [],
    faqs: buildFaqs(c.price, c.duration, area, c.transmission),
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
  };

  return applyOverrides(base, c.customization);
}

/** Builder wizard config → live TemplateData for preview & publish. */
export function wizardToTemplateData(w: WizardConfig): TemplateData {
  const locale = w.locale.toLowerCase() as Locale;
  const hours: Hour[] = WEEK.map((d) => {
    if (w.customHoursPerDay) {
      const ph = w.perDayHours[d];
      const open = ph && !ph.closed;
      return { day: title(d), open: open ? ph.open : '', close: open ? ph.close : '', closed: !open };
    }
    const open = w.workingDays.includes(d);
    return { day: title(d), open: open ? w.shiftStart : '', close: open ? w.shiftEnd : '', closed: !open };
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
  const hours = p.businessHours ? hoursFromMap(p.businessHours) : sampleData.hours;
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
    reviews: p.reviews || undefined,
    customization: p.customization || undefined,
  });
}
