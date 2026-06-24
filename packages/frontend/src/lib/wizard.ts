import type { BusinessHours } from './types';

export interface WizardConfig {
  businessName: string;
  teacherName: string;
  tagline: string;
  bio: string;
  experienceYears: string;
  passRate: number;
  pricePerClass: number;
  classDuration: number;
  workingDays: string[]; // monday..sunday
  shiftStart: string;
  shiftEnd: string;
  breakStart: string;
  breakEnd: string;
  hasBreak: boolean;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  locale: 'HE' | 'AR' | 'EN';
  presetId: string;
}

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export const defaultWizardConfig: WizardConfig = {
  businessName: '',
  teacherName: '',
  tagline: 'Your road to confidence',
  bio: '',
  experienceYears: '10+',
  passRate: 95,
  pricePerClass: 50,
  classDuration: 45,
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  shiftStart: '08:00',
  shiftEnd: '18:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  hasBreak: true,
  phone: '',
  email: '',
  address: '',
  instagram: '',
  facebook: '',
  locale: 'EN',
  presetId: 'clear-horizon',
};

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
  } catch {
    /* ignore */
  }
}

export function clearWizard() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Build the businessHours object the booking engine uses from wizard fields. */
export function buildBusinessHours(c: WizardConfig): BusinessHours {
  const hours: BusinessHours = {};
  for (const d of WEEKDAYS) {
    hours[d] = { isOpen: c.workingDays.includes(d), open: c.shiftStart, close: c.shiftEnd };
  }
  return hours;
}

/** Map wizard fields → the generator's businessConfig (stored on Website.configuration). */
export function toBusinessConfig(c: WizardConfig): Record<string, unknown> {
  return {
    teacherName: c.teacherName || c.businessName,
    tagline: c.tagline,
    bio: c.bio || undefined,
    pricePerClass: c.pricePerClass,
    classDuration: c.classDuration,
    experienceYears: c.experienceYears,
    passRate: c.passRate,
    advanceBookingDays: 14,
    bookingCutoffHour: 18,
    dailyCodeEnabled: true,
    restMinutes: 0,
    breakTimes: c.hasBreak ? [{ start: c.breakStart, end: c.breakEnd }] : [],
    shiftStart: c.shiftStart,
    shiftEnd: c.shiftEnd,
    contact: { phone: c.phone || undefined, email: c.email || undefined, address: c.address || undefined },
    socialLinks: { Instagram: c.instagram || undefined, Facebook: c.facebook || undefined },
    locale: c.locale.toLowerCase(),
  };
}
