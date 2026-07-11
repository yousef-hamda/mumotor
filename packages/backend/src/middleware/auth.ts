import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from '../utils/errors.js';
import type { AuthPayload, StudentAuthPayload } from '../types/index.js';

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

/** Sign a student-portal session token. Scoped to one website; 7-day lifetime
 *  (passwordless email login is a weak factor — keep the session short). */
export function signStudentToken(payload: StudentAuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' } as jwt.SignOptions);
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.token) return req.cookies.token as string;
  return null;
}

/** Require a valid teacher/admin JWT; attaches req.user. Student tokens (which
 *  carry kind:'student') are rejected so they can never reach a teacher route. */
export function verifyToken(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(unauthorized('Authentication required', 'NO_TOKEN'));
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload & { kind?: string };
    if (decoded.kind === 'student') return next(unauthorized('Invalid or expired token', 'BAD_TOKEN'));
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    next(unauthorized('Invalid or expired token', 'BAD_TOKEN'));
  }
}

/** Require a valid student-portal token whose websiteId matches the route.
 *  Attaches req.student. Teacher tokens (no kind) are rejected. */
export function requireStudent(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(unauthorized('Sign in to your student account', 'NO_TOKEN'));
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as Partial<StudentAuthPayload>;
    if (decoded.kind !== 'student' || !decoded.sub || !decoded.websiteId) {
      return next(unauthorized('Invalid or expired session', 'BAD_TOKEN'));
    }
    // Bearer token must be for the site in the URL (anti cross-tenant use).
    if (req.params.websiteId && decoded.websiteId !== req.params.websiteId) {
      return next(unauthorized('Invalid or expired session', 'BAD_TOKEN'));
    }
    req.student = { enrollmentId: decoded.sub, websiteId: decoded.websiteId, email: decoded.email ?? '' };
    next();
  } catch {
    next(unauthorized('Invalid or expired session', 'BAD_TOKEN'));
  }
}
