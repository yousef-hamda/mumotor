export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  preferredLanguage?: 'HE' | 'AR' | 'EN';
  role?: string;
  emailVerified?: boolean;
}

export interface Review {
  id: string;
  websiteId: string;
  studentName: string;
  rating: number;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reply: string | null;
  createdAt: string;
}

export interface Plan {
  id: 'FREE' | 'PRO' | 'STUDIO';
  name: string;
  price: number;
  features: string[];
  currency?: string;
  period?: string;
  note?: string;
}

/** Free-trial + per-website paywall state — mirrors the backend getAccountState(). */
export interface AccountState {
  plan: 'FREE' | 'PRO' | 'STUDIO';
  status: string;
  onTrial: boolean;
  trialDaysLeft: number;
  trialEndsAt: string | null;
  paid: boolean;
  quota: number;
  websiteCount: number;
  publishedCount: number;
  canAddWebsite: boolean;
  locked: boolean;
  websitePrice: number;
}

export interface SubscriptionInfo {
  subscription: { plan: 'FREE' | 'PRO' | 'STUDIO'; status: string; currentPeriodEnd: string | null };
  account?: AccountState;
  plans: Plan[];
}

export type WebsiteStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED';

export interface Website {
  id: string;
  userId: string;
  name: string;
  slug: string;
  tagline: string | null;
  businessCategory: string;
  status: WebsiteStatus;
  selectedPreset: string | null;
  locale: 'HE' | 'AR' | 'EN';
  configuration: Record<string, unknown>;
  publishedHtml?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  settings?: SiteSettings | null;
  _count?: { enrollments: number; bookings: number };
}

export interface SiteSettings {
  id: string;
  websiteId: string;
  businessHours: BusinessHours;
}

export interface BusinessHours {
  [day: string]: { isOpen: boolean; open: string; close: string };
}

export type EnrollmentStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'SUSPENDED';

export interface Student {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  status: EnrollmentStatus;
  classCount: number;
  notes: string | null;
  enrolledAt: string;
  finishedAt: string | null;
}

export interface StudentsResponse {
  students: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DrivingSettings {
  enrollmentCode: string;
  classDuration: number;
  advanceBookingDays: number;
  bookingCutoffHour: number;
  bookingWindowStart: string;
  bookingWindowEnd: string;
  reportTime: string;
  dailyCodeEnabled: boolean;
  breakTimes: { start: string; end: string }[];
  restMinutes: number;
  workingHours: BusinessHours;
  teacherName: string;
  pricePerClass: number | string | null;
  experienceYears: number | string | null;
  passRate: number | null;
}

export interface ReportSlot {
  time: string;
  booked: boolean;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  bookingId?: string;
  classCount?: number;
}

export interface DailyReport {
  date: string;
  isOpen: boolean;
  open: string | null;
  close: string | null;
  slots: ReportSlot[];
  totals: { booked: number; empty: number; total: number };
}

export type ScheduleDay = 'today' | 'tomorrow';

export interface DailyCode {
  code: string;
  date: string;
  isActive: boolean;
}

export interface PublicSettings {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  advanceBookingDays: number;
  bookingCutoffHour: number;
  bookingWindowStart?: string;
  bookingWindowEnd?: string;
  classDuration: number;
  dailyCodeEnabled: boolean;
  requiresStaticCode: boolean;
  businessHours: BusinessHours;
  breakTimes: { start: string; end: string }[];
  teacherName: string | null;
  pricePerClass: number | null;
  experienceYears: number | null;
  passRate: number | null;
  services: { name: string; duration: number; price: number }[];
  // template + branding tokens for the public React-rendered site
  template?: string | null;
  locale?: string | null;
  bio?: string | null;
  experienceLevel?: string | null;
  transmission?: string | null;
  plans?: unknown[] | null;
  city?: string | null;
  logoSrc?: string | null;
  carPhoto?: string | null;
  instructorPhoto?: string | null;
  gallery?: string[] | null;
  contact?: { phone?: string; email?: string; address?: string } | null;
  socialLinks?: Record<string, string> | null;
  customization?: Record<string, unknown> | null;
}

export interface CheckEnrollment {
  enrolled: boolean;
  active?: boolean;
}

export interface AvailabilityResponse {
  date: string;
  slots: string[];
  classDuration: number;
  closed?: boolean;
}
