import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export interface AuthPayload {
  id: string;
  email: string;
}

/** Default scheduling config stored on Website.configuration. */
export interface DrivingConfig {
  enrollmentCode?: string; // optional static enrollment code (min 4 chars)
  classDuration?: number; // 30–240 min, default 60
  breakTimes?: { start: string; end: string }[];
  advanceBookingDays?: number; // 1–90, default 1 (public client default 14)
  bookingCutoffHour?: number; // 0–23, default 18
  dailyCodeEnabled?: boolean; // default true
  // Presentation / marketing tokens (used by the public site)
  teacherName?: string;
  pricePerClass?: number;
  experienceYears?: number;
  passRate?: number;
  restMinutes?: number;
}

export interface BusinessHours {
  [day: string]: { isOpen: boolean; open: string; close: string };
}
