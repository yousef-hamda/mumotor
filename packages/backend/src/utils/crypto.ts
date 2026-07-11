import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Constant-time comparison of two strings (length-leak resistant). */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  // Compare equal-length buffers to avoid throwing; hash both so the lengths match.
  const ah = createHash('sha256').update(ab).digest();
  const bh = createHash('sha256').update(bb).digest();
  return timingSafeEqual(ah, bh) && a.length === b.length;
}

function sha256(salt: string, value: string): string {
  return createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

/** Hash an enrollment code as "sha256:{salt}:{hash}". Never stored plaintext. */
export function hashEnrollmentCode(code: string): string {
  const salt = randomBytes(8).toString('hex');
  return `sha256:${salt}:${sha256(salt, code)}`;
}

/** Verify a plaintext code against a stored "sha256:{salt}:{hash}" value. */
export function verifyEnrollmentCode(code: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'sha256') return false;
  const [, salt, hash] = parts;
  const candidate = sha256(salt, code);
  return timingSafeEqualStr(candidate, hash);
}

/** Generate a 6-char uppercase hex daily code, e.g. "A3F8B2". */
export function generateDailyCodeValue(): string {
  return randomBytes(3).toString('hex').toUpperCase();
}

/** One-way hash of a high-entropy single-use token, used as the KV key so the raw
 *  token is never stored (only lives in the emailed URL). No salt: nanoid(48) is
 *  already unguessable, and a hash makes any KV log/backup leak non-usable (L1). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
