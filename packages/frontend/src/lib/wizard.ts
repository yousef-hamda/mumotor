import type { BusinessHours } from './types';
import type { Customization } from '../templates/customize/overrides';

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export type ExperienceLevel = '1-3' | '3-5' | '5-10' | '10+';

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; min: number }[] = [
  { value: '1-3', label: '1–3 years', min: 1 },
  { value: '3-5', label: '3–5 years', min: 3 },
  { value: '5-10', label: '5–10 years', min: 5 },
  { value: '10+', label: '10+ years', min: 10 },
];

/** Social platforms the owner can add (Part 2 — Extras). 10 buttons. */
export const SOCIAL_PLATFORMS = [
  'Facebook',
  'Instagram',
  'TikTok',
  'YouTube',
  'X',
  'LinkedIn',
  'WhatsApp',
  'Pinterest',
  'Telegram',
  'Snapchat',
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** A lesson plan the teacher defines (name + price + unit/text + features). */
export interface PlanInput {
  id: string;
  name: string;
  price: number;
  unit: string;
  features: string[];
  popular?: boolean;
}

export type Transmission = 'manual' | 'automatic' | 'both';
export const TRANSMISSIONS: { value: Transmission; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'both', label: 'Both' },
];

export function transmissionFeature(t: Transmission): string {
  return t === 'both' ? 'Manual or automatic' : t === 'manual' ? 'Manual transmission' : 'Automatic transmission';
}

/** Seed the first plan from the per-lesson price + transmission choice. */
export function defaultPlan(price: number, transmission: Transmission): PlanInput {
  return {
    id: 'single',
    name: 'Single lesson',
    price: price || 0,
    unit: '/ lesson',
    features: [transmissionFeature(transmission), 'Door-to-door pickup', 'No commitment'],
  };
}

export interface WizardConfig {
  // ── Part 1: Business Info ──────────────────────────────────────────────
  businessName: string;
  businessDescription: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  logoSrc?: string;

  // ── Part 2A: Schedule & availability ───────────────────────────────────
  workingDays: string[];
  shiftStart: string;
  shiftEnd: string;
  customHoursPerDay: boolean;
  perDayHours: Record<string, DayHours>;
  breakTimes: { start: string; end: string }[];
  restEnabled: boolean;
  restMinutes: number;

  // ── Part 2B: Lessons & pricing ─────────────────────────────────────────
  classDuration: number;
  pricePerClass: number;
  transmission: Transmission;
  /** Teacher-defined plans (the first is the single lesson, seeded from price). */
  plans: PlanInput[];

  // ── Part 2C: Teacher profile ───────────────────────────────────────────
  teacherName: string;
  experienceLevel: ExperienceLevel;
  carPhoto?: string;
  instructorPhoto?: string;

  // ── Part 2D: Booking rules ─────────────────────────────────────────────
  bookingWindowStart: string;
  bookingWindowEnd: string;
  reportTime: string;

  // ── Part 2E: Extras ────────────────────────────────────────────────────
  socialLinks: Partial<Record<SocialPlatform, string>>;
  gallery: string[];

  // ── Design ─────────────────────────────────────────────────────────────
  locale: 'HE' | 'AR' | 'EN';
  /** True once the teacher deliberately picked the site language in the wizard.
   *  While false/absent, the site language follows the app UI language (so a
   *  fresh/untouched draft never gets stuck on a stale language). */
  localeTouched?: boolean;
  templateChoice?: string;
  /** Customize-mode overrides (colours, text, photos). */
  customization?: Customization;
  /** @deprecated legacy preset id — kept for back-compat, unused by templates. */
  presetId: string;
}

function emptyPerDay(): Record<string, DayHours> {
  const out: Record<string, DayHours> = {};
  for (const d of WEEKDAYS) out[d] = { open: '08:00', close: '18:00', closed: d === 'saturday' || d === 'sunday' };
  return out;
}

export const defaultWizardConfig: WizardConfig = {
  businessName: '',
  businessDescription: '',
  tagline: 'Your road to confidence',
  phone: '',
  email: '',
  address: '',
  city: '',
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  shiftStart: '08:00',
  shiftEnd: '18:00',
  customHoursPerDay: false,
  perDayHours: emptyPerDay(),
  breakTimes: [],
  restEnabled: false,
  restMinutes: 10,
  classDuration: 45,
  pricePerClass: 100,
  transmission: 'both',
  plans: [defaultPlan(100, 'both')],
  teacherName: '',
  experienceLevel: '5-10',
  bookingWindowStart: '09:00',
  bookingWindowEnd: '17:00',
  reportTime: '18:00',
  socialLinks: {},
  gallery: [],
  locale: 'EN',
  presetId: 'clear-horizon',
};

/** Localized, language-specific parts of the "Auto-fill sample" so the preview
 *  renders fully in the chosen language. Numbers/prices stay Latin digits. */
type SampleContent = {
  businessName: string;
  businessDescription: string;
  tagline: string;
  teacherName: string;
  address: string;
  city: string;
  plans: PlanInput[];
};
const SAMPLE_CONTENT: Record<'EN' | 'HE' | 'AR', SampleContent> = {
  EN: {
    businessName: 'Northgate Driving School',
    businessDescription:
      'Calm, patient, one-to-one driving lessons with a 96% first-time pass rate. I help nervous beginners feel in control from the very first lesson — manual or automatic, fully insured dual-control car.',
    tagline: 'Pass first time, drive for life.',
    teacherName: 'David Cohen',
    address: '22 Jabotinsky Street',
    city: 'Netanya',
    plans: [
      { id: 'single', name: 'Single lesson', price: 120, unit: '/ lesson', features: ['Manual or automatic', 'Door-to-door pickup', 'No commitment'] },
      { id: 'block10', name: '10-lesson block', price: 1100, unit: '10 lessons', popular: true, features: ['Save vs single lessons', 'Mock test included', 'Flexible rescheduling'] },
    ],
  },
  HE: {
    businessName: 'בית ספר לנהיגה נורת׳גייט',
    businessDescription:
      'שיעורי נהיגה אישיים, רגועים וסבלניים עם 96% הצלחה בטסט הראשון. אני עוזר למתחילים לחוצים להרגיש בשליטה כבר מהשיעור הראשון — ידני או אוטומט, רכב מבוטח עם דוושות כפולות.',
    tagline: 'עוברים טסט בפעם הראשונה, נוהגים לכל החיים.',
    teacherName: 'דוד כהן',
    address: 'רחוב ז׳בוטינסקי 22',
    city: 'נתניה',
    plans: [
      { id: 'single', name: 'שיעור בודד', price: 120, unit: '/ שיעור', features: ['ידני או אוטומט', 'איסוף עד הבית', 'ללא התחייבות'] },
      { id: 'block10', name: 'חבילת 10 שיעורים', price: 1100, unit: '10 שיעורים', popular: true, features: ['חיסכון מול שיעור בודד', 'כולל מבחן דמה', 'גמישות בשינוי מועד'] },
    ],
  },
  AR: {
    businessName: 'مدرسة نورثغيت للقيادة',
    businessDescription:
      'دروس قيادة فردية هادئة وصبورة بنسبة نجاح 96% من أول مرة. أساعد المبتدئين المتوترين على الشعور بالسيطرة منذ الدرس الأول — يدوي أو أوتوماتيك، سيارة مؤمّنة مزدوجة التحكّم.',
    tagline: 'انجح من أول مرة، وقُد مدى الحياة.',
    teacherName: 'داود كوهين',
    address: 'شارع جابوتنسكي 22',
    city: 'نتانيا',
    plans: [
      { id: 'single', name: 'درس واحد', price: 120, unit: '/ درس', features: ['يدوي أو أوتوماتيك', 'اصطحاب من الباب إلى الباب', 'بدون التزام'] },
      { id: 'block10', name: 'باقة 10 دروس', price: 1100, unit: '10 دروس', popular: true, features: ['وفّر مقارنة بالدرس المنفرد', 'يشمل اختبار تجريبي', 'مرونة في تغيير الموعد'] },
    ],
  },
};

/** Realistic sample data so the owner can preview before editing ("Auto-generate").
 *  Language-specific content follows the currently-selected locale. */
export function sampleWizardConfig(prev: WizardConfig): WizardConfig {
  const content = SAMPLE_CONTENT[prev.locale] ?? SAMPLE_CONTENT.EN;
  return {
    ...prev,
    businessName: content.businessName,
    businessDescription: content.businessDescription,
    tagline: content.tagline,
    phone: '054-321-0987',
    email: 'hello@northgate.driving',
    address: content.address,
    city: content.city,
    workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
    shiftStart: '08:00',
    shiftEnd: '19:00',
    breakTimes: [{ start: '13:00', end: '14:00' }],
    restEnabled: true,
    restMinutes: 10,
    classDuration: 45,
    pricePerClass: 120,
    transmission: 'both',
    plans: content.plans.map((p) => ({ ...p, features: [...(p.features ?? [])] })),
    teacherName: content.teacherName,
    experienceLevel: '10+',
    bookingWindowStart: '09:00',
    bookingWindowEnd: '17:00',
    reportTime: '18:00',
    socialLinks: { Instagram: 'https://instagram.com/northgate.driving', Facebook: 'https://facebook.com/northgate.driving' },
  };
}

const STORAGE_KEY = 'mumotor_wizard';

export function loadWizard(): WizardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultWizardConfig, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...defaultWizardConfig };
}

export function saveWizard(c: WizardConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    localStorage.setItem(`${STORAGE_KEY}_saved_at`, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** When the local wizard copy was last written (0 = never). Compared against the server draft. */
export function wizardSavedAt(): number {
  try {
    return Number(localStorage.getItem(`${STORAGE_KEY}_saved_at`)) || 0;
  } catch {
    return 0;
  }
}

export function clearWizard() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}_saved_at`);
  } catch {
    /* ignore */
  }
}

/** Working-hours object the booking engine uses (per-day or uniform shift). */
export function buildBusinessHours(c: WizardConfig): BusinessHours {
  const hours: BusinessHours = {};
  for (const d of WEEKDAYS) {
    if (c.customHoursPerDay) {
      const ph = c.perDayHours[d] ?? { open: c.shiftStart, close: c.shiftEnd, closed: true };
      hours[d] = { isOpen: !ph.closed, open: ph.open, close: ph.close };
    } else {
      hours[d] = { isOpen: c.workingDays.includes(d), open: c.shiftStart, close: c.shiftEnd };
    }
  }
  return hours;
}

/** Hour (0-23) from an "HH:MM" string; `fallback` only when unset/invalid — NOT for "00". */
export function hourOf(time: string | undefined, fallback: number): number {
  const h = Number((time || '').split(':')[0]);
  return Number.isInteger(h) && h >= 0 && h <= 23 ? h : fallback;
}

/** Map wizard fields → the generator/config blob stored on Website.configuration. */
export function toBusinessConfig(c: WizardConfig): Record<string, unknown> {
  return {
    teacherName: c.teacherName || c.businessName,
    tagline: c.tagline,
    bio: c.businessDescription || undefined,
    pricePerClass: c.pricePerClass,
    classDuration: c.classDuration,
    transmission: c.transmission,
    plans: c.plans,
    experienceLevel: c.experienceLevel,
    advanceBookingDays: 1,
    bookingCutoffHour: hourOf(c.reportTime, 18),
    dailyCodeEnabled: true,
    restMinutes: c.restEnabled ? c.restMinutes : 0,
    breakTimes: c.breakTimes,
    shiftStart: c.shiftStart,
    shiftEnd: c.shiftEnd,
    customHoursPerDay: c.customHoursPerDay,
    perDayHours: c.perDayHours,
    bookingWindowStart: c.bookingWindowStart,
    bookingWindowEnd: c.bookingWindowEnd,
    reportTime: c.reportTime,
    city: c.city || undefined,
    contact: {
      phone: c.phone || undefined,
      email: c.email || undefined,
      address: [c.address, c.city].filter(Boolean).join(', ') || undefined,
    },
    socialLinks: c.socialLinks,
    locale: c.locale.toLowerCase(),
    templateChoice: c.templateChoice || undefined,
    logoSrc: c.logoSrc || undefined,
    carPhoto: c.carPhoto || undefined,
    instructorPhoto: c.instructorPhoto || undefined,
    gallery: c.gallery,
    customization: c.customization || undefined,
  };
}
