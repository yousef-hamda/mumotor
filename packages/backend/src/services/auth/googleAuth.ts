import { createRemoteJWKSet, jwtVerify } from 'jose';
import { prisma } from '../../lib/prisma.js';
import { TRIAL_DAYS } from '../billing/accountState.js';

/** The claims we read from a verified Google ID token. */
export interface GoogleIdTokenClaims {
  email?: string;
  email_verified?: boolean;
  sub?: string;
  name?: string;
  picture?: string;
}

// Google's public signing keys (JWKS) — fetched on first use, then cached and
// auto-refreshed by jose. No network happens at import time.
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

/**
 * Verify a Google ID token: RS256 signature against Google's JWKS + issuer + audience
 * (our OAuth client id) + expiry (jose enforces exp/iat). Throws if anything is wrong.
 * Returns the token's claims. This is the standard OIDC ID-token verification.
 */
export async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<GoogleIdTokenClaims> {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
  });
  return payload as GoogleIdTokenClaims;
}

/**
 * Resolve a VERIFIED Google identity to a Mumotor user, creating or linking as needed.
 * Pure DB logic (no HTTP), so it can be unit-tested with a fake payload.
 *   1. known googleId  → that user
 *   2. same email      → link the Google id onto the existing account (+ mark verified)
 *   3. brand new       → create a password-less account + the free-month trial
 * Google has already verified the email, so `emailVerified` is set true.
 */
export async function upsertGoogleUser(payload: Pick<GoogleIdTokenClaims, 'email' | 'sub' | 'name' | 'picture'>) {
  const email = String(payload.email).toLowerCase().trim();
  const googleId = String(payload.sub);
  const name = payload.name?.trim() || email.split('@')[0];
  const avatarUrl = payload.picture ?? null;

  const byGoogle = await prisma.user.findUnique({ where: { googleId } });
  if (byGoogle) return byGoogle;

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { googleId, emailVerified: true, avatarUrl: byEmail.avatarUrl ?? avatarUrl },
    });
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  try {
    return await prisma.user.create({
      data: {
        email,
        name,
        googleId,
        avatarUrl,
        emailVerified: true,
        subscription: { create: { plan: 'FREE', status: 'TRIALING', trialEndsAt, websiteQuota: 1 } },
      },
    });
  } catch (err) {
    // Two concurrent first-time logins raced the unique email/googleId → re-read.
    if ((err as { code?: string }).code === 'P2002') {
      const existing = (await prisma.user.findUnique({ where: { googleId } })) ?? (await prisma.user.findUnique({ where: { email } }));
      if (existing) return existing;
    }
    throw err;
  }
}
