import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { unauthorized } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthPayload, StudentAuthPayload } from '../types/index.js';

// HMAC only — pin the algorithm on both sign and verify so a token can never be
// accepted under a different (e.g. asymmetric or `none`) algorithm.
const JWT_ALG: jwt.Algorithm = 'HS256';

export function signToken(payload: AuthPayload): string {
  return jwt.sign({ ...payload, kind: 'teacher' }, env.JWT_SECRET, {
    algorithm: JWT_ALG,
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/** Sign a student-portal session token. Scoped to one website; 7-day lifetime
 *  (passwordless email login is a weak factor — keep the session short). */
export function signStudentToken(payload: StudentAuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { algorithm: JWT_ALG, expiresIn: '7d' } as jwt.SignOptions);
}

/** Bearer header only. The `token` cookie is deliberately NOT trusted: the SPA and
 *  student portal both send the token as a Bearer header, and honouring a cookie
 *  would open a CSRF vector (credentialed cross-site requests riding the cookie). */
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** Require a valid teacher/admin JWT; attaches req.user. Student tokens (which
 *  carry kind:'student') are rejected so they can never reach a teacher route.
 *  Stateful: the token's `tv` must match the user's current `tokenVersion`
 *  (revocation on password change/reset) and the account must still exist. */
export const verifyToken = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next(unauthorized('Authentication required', 'NO_TOKEN'));
  let decoded: AuthPayload & { kind?: string };
  try {
    decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: [JWT_ALG] }) as AuthPayload & { kind?: string };
  } catch {
    return next(unauthorized('Invalid or expired token', 'BAD_TOKEN'));
  }
  // Positive typing: a teacher token is 'teacher' or a legacy token with no kind.
  // Anything else (notably kind:'student') is rejected.
  if (decoded.kind !== undefined && decoded.kind !== 'teacher') {
    return next(unauthorized('Invalid or expired token', 'BAD_TOKEN'));
  }
  if (!decoded.id) return next(unauthorized('Invalid or expired token', 'BAD_TOKEN'));

  const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { tokenVersion: true } });
  if (!user) return next(unauthorized('Invalid or expired token', 'BAD_TOKEN')); // deleted account
  if ((decoded.tv ?? 0) !== user.tokenVersion) {
    return next(unauthorized('Session expired — please sign in again', 'TOKEN_REVOKED'));
  }

  req.user = { id: decoded.id, email: decoded.email };
  next();
});

/** Require a valid student-portal token whose websiteId matches the route.
 *  Attaches req.student. Teacher tokens (no kind) are rejected. */
export function requireStudent(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(unauthorized('Sign in to your student account', 'NO_TOKEN'));
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: [JWT_ALG] }) as Partial<StudentAuthPayload>;
    if (decoded.kind !== 'student' || !decoded.sub || !decoded.websiteId) {
      return next(unauthorized('Invalid or expired session', 'BAD_TOKEN'));
    }
    // Fail closed: a student token is bound to one website, and every student route
    // carries :websiteId. If the param is ever missing we reject rather than skip
    // the tenant check (defence-in-depth against a future un-scoped student route).
    if (!req.params.websiteId || decoded.websiteId !== req.params.websiteId) {
      return next(unauthorized('Invalid or expired session', 'BAD_TOKEN'));
    }
    req.student = { enrollmentId: decoded.sub, websiteId: decoded.websiteId, email: decoded.email ?? '' };
    next();
  } catch {
    next(unauthorized('Invalid or expired session', 'BAD_TOKEN'));
  }
}
