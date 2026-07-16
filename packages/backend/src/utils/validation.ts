import { z } from 'zod';

// --- Shared field schemas ---------------------------------------------------

/** Contact phone: leading + or digit, then 6–18 of digit/space/dash. Identical
 *  to the regex used at teacher signup, public enroll, and add-student — kept in
 *  one place so every phone field validates the same way. Bounds length; does not
 *  verify the number is real (deliberate — teachers/students type freely). */
export const PHONE_REGEX = /^[+\d][\d\s-]{6,18}$/;
export const phoneSchema = z.string().regex(PHONE_REGEX, 'A valid phone number is required');

/** "HH:MM" 24-hour wall-clock time (00:00–23:59 is not range-checked here, only shape). */
export const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
export const hhmm = z.string().regex(HHMM_REGEX, 'Time must be HH:MM');

/** The seven weekday keys used for working hours. Any other key is rejected so a
 *  teacher (or a stolen token) can't stuff arbitrary keys into settings.businessHours. */
export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

/** working-hours record: only the 7 weekday keys, each {isOpen, open HH:MM, close HH:MM}. */
export const weekdayHoursSchema = z
  .record(z.enum(WEEKDAYS), z.object({ isOpen: z.boolean(), open: hhmm, close: hhmm }))
  .refine((r) => Object.keys(r).length <= 7, 'Too many days');

/**
 * A JSON object field with a hard serialized-size ceiling. The wizard/customization
 * `configuration` and AI `businessConfig` blobs are stored verbatim; without this the
 * only bound was the 10 MB body limit, letting one PATCH persist megabytes of arbitrary
 * JSON into a hot column. Real configs (incl. the embedded ~30 KB generated HTML) are
 * well under the default 2 MB cap.
 */
export function boundedRecord(maxBytes = 2 * 1024 * 1024) {
  return z.record(z.any()).refine(
    (obj) => {
      try {
        return Buffer.byteLength(JSON.stringify(obj)) <= maxBytes;
      } catch {
        return false; // circular / unserialisable → reject
      }
    },
    { message: `Configuration is too large (max ${Math.round(maxBytes / 1024)} KB)` }
  );
}

// --- Password strength ------------------------------------------------------

/** The most common breached passwords (>= 8 chars, so they pass the length rule).
 *  A small local denylist — not a full HIBP check, but it rejects the obvious ones. */
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwerty123', 'qwertyuiop', '11111111', '00000000', 'iloveyou', 'admin123',
  'welcome1', 'welcome123', 'letmein1', 'monkey123', 'football', 'baseball',
  'sunshine', 'princess', 'passw0rd', 'trustno1', 'whatever1', 'starwars',
  'abc12345', 'aaaaaaaa', '1q2w3e4r', 'zaq12wsx', 'dragon123', 'master123',
]);

/**
 * Reject trivially-weak passwords beyond the length check: common breached
 * passwords and passwords that just echo the account's email local-part.
 * Returns an error message, or null when the password is acceptable.
 */
export function weakPasswordReason(password: string, email?: string): string | null {
  const pw = password.trim();
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) {
    return 'This password is too common — choose something harder to guess';
  }
  if (email) {
    const local = email.split('@')[0]?.toLowerCase();
    if (local && local.length >= 3 && pw.toLowerCase() === local) {
      return 'Password must not match your email';
    }
  }
  return null;
}
