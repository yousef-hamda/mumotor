import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

/**
 * Unsubscribe links (A-02).
 *
 * The token is SIGNED, not stored. Two reasons that matters here:
 *  - An unsubscribe link must keep working forever. Anything with an expiry or a
 *    one-time database row eventually produces a dead link, and a dead unsubscribe link
 *    is exactly what turns an annoyed recipient into a spam complaint.
 *  - It must survive the student row being read from a cold email months later without
 *    a lookup table to maintain.
 *
 * Format: `<base64url(enrollmentId)>.<base64url(HMAC-SHA256)>`, truncated to 128 bits of
 * signature — far beyond guessable, and short enough to survive email clients that wrap
 * long URLs.
 *
 * The signature is keyed with JWT_SECRET, so rotating that secret invalidates old
 * unsubscribe links. That is an accepted trade-off: the secret is only rotated
 * deliberately, and every subsequent email carries a freshly-signed link.
 */

const b64url = (b: Buffer) => b.toString('base64url');

function sign(enrollmentId: string): string {
  return b64url(createHmac('sha256', env.JWT_SECRET).update(`unsub:${enrollmentId}`).digest()).slice(0, 22);
}

/** Opaque token identifying one student's subscription, safe to put in a URL. */
export function makeUnsubscribeToken(enrollmentId: string): string {
  return `${b64url(Buffer.from(enrollmentId, 'utf8'))}.${sign(enrollmentId)}`;
}

/** The enrollment id a token refers to, or null if it is malformed or not ours. */
export function readUnsubscribeToken(token: string): string | null {
  const [idPart, sigPart] = String(token).split('.');
  if (!idPart || !sigPart) return null;

  let enrollmentId: string;
  try {
    enrollmentId = Buffer.from(idPart, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  // Bound the decoded value before it reaches a uuid column, and reject anything that
  // isn't shaped like one rather than letting the database raise.
  if (!/^[0-9a-f-]{36}$/i.test(enrollmentId)) return null;

  const expected = Buffer.from(sign(enrollmentId), 'utf8');
  const actual = Buffer.from(sigPart, 'utf8');
  if (expected.length !== actual.length) return null;
  return timingSafeEqual(expected, actual) ? enrollmentId : null;
}

/** The absolute link that goes in the email footer and the List-Unsubscribe header. */
export function unsubscribeUrl(enrollmentId: string): string {
  return `${env.APP_URL.replace(/\/+$/, '')}/unsubscribe/${makeUnsubscribeToken(enrollmentId)}`;
}
