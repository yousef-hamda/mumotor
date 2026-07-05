import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { kv } from '../lib/redis.js';
import { env } from '../config/env.js';
import { signToken, verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, conflict, unauthorized } from '../utils/errors.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { sendEmailVerification, sendPasswordReset } from '../services/email/emailService.js';

const router = Router();

const BCRYPT_ROUNDS = 12;
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128);

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(1),
  // Phone is required at signup — the teacher's own contact number, same
  // validation style as the public enroll form's studentPhone.
  phone: z.string().regex(/^[+\d][\d\s-]{6,18}$/, 'A valid phone number is required'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(u: { id: string; email: string; name: string; phone: string | null; preferredLanguage?: string; role?: string; emailVerified?: boolean }) {
  return { id: u.id, email: u.email, name: u.name, phone: u.phone, preferredLanguage: u.preferredLanguage, role: u.role, emailVerified: u.emailVerified };
}

// Email verification: one-time KV token, 24h TTL, same shape as password reset.
const VERIFY_TTL_SECONDS = 24 * 3600;
async function sendVerification(user: { id: string; email: string; name: string }): Promise<void> {
  const token = nanoid(48);
  await kv.setex(`emailverify:${token}`, VERIFY_TTL_SECONDS, user.id);
  void sendEmailVerification(user.email, {
    name: user.name,
    verifyUrl: `${env.FRONTEND_URL}/verify-email?token=${token}`,
  });
}

// POST /auth/register
router.post(
  '/register',
  rateLimit({ keyPrefix: 'register', windowSeconds: 3600, max: 20 }),
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw conflict('An account with this email already exists', 'EMAIL_TAKEN');

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: data.name.trim(), phone: data.phone.trim() },
    });

    void sendVerification(user); // fire-and-forget; registration never blocks on email

    const token = signToken({ id: user.id, email: user.email });
    res.status(201).json({ token, user: publicUser(user) });
  })
);

// POST /auth/login
router.post(
  '/login',
  rateLimit({ keyPrefix: 'login', windowSeconds: 900, max: 30 }),
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw unauthorized('Invalid email or password', 'BAD_CREDENTIALS');

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) throw unauthorized('Invalid email or password', 'BAD_CREDENTIALS');

    const token = signToken({ id: user.id, email: user.email });
    res.json({ token, user: publicUser(user) });
  })
);

// GET /auth/me
router.get(
  '/me',
  verifyToken,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw unauthorized('Account not found');
    res.json({ user: publicUser(user) });
  })
);

// PATCH /auth/me — update profile + preferred language
router.patch(
  '/me',
  verifyToken,
  asyncHandler(async (req, res) => {
    const data = z
      .object({ name: z.string().min(1).max(120).optional(), phone: z.string().max(40).optional(), preferredLanguage: z.enum(['HE', 'AR', 'EN']).optional() })
      .parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user!.id }, data });
    res.json({ user: publicUser(user) });
  })
);

// POST /auth/change-password
router.post(
  '/change-password',
  verifyToken,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = z
      .object({ currentPassword: z.string().min(1), newPassword: passwordSchema })
      .parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw unauthorized('Account not found');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw badRequest('Current password is incorrect', 'BAD_PASSWORD');
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) } });
    res.json({ success: true });
  })
);

// POST /auth/verify-email — consume the token, mark the account verified.
router.post(
  '/verify-email',
  rateLimit({ keyPrefix: 'verify-email', windowSeconds: 900, max: 15 }),
  asyncHandler(async (req, res) => {
    const { token } = z.object({ token: z.string().min(20).max(80) }).parse(req.body);
    const userId = await kv.getdel(`emailverify:${token}`); // atomic: one use only
    if (!userId) throw badRequest('Verification link is invalid or expired', 'VERIFY_INVALID');
    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    res.json({ verified: true });
  })
);

// POST /auth/resend-verification — logged-in user asks for a fresh link.
router.post(
  '/resend-verification',
  verifyToken,
  rateLimit({ keyPrefix: 'resend-verify', windowSeconds: 3600, max: 10 }),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw unauthorized('Account not found');
    if (!user.emailVerified) {
      const perEmail = await kv.incrWithExpiry(`verify-email-sends:${user.email}`, 3600);
      if (perEmail <= 5) await sendVerification(user);
    }
    res.json({ sent: true });
  })
);

// POST /auth/forgot-password — always responds 200 (no account enumeration).
// One-time token in the KV store, 30-minute TTL, emailed as a reset link.
const RESET_TTL_SECONDS = 30 * 60;
router.post(
  '/forgot-password',
  rateLimit({ keyPrefix: 'forgot-pw', windowSeconds: 3600, max: 10 }),
  asyncHandler(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const normalized = email.toLowerCase().trim();

    const perEmail = await kv.incrWithExpiry(`forgot-pw-email:${normalized}`, 3600);
    if (perEmail <= 5) {
      const user = await prisma.user.findUnique({ where: { email: normalized } });
      if (user) {
        const token = nanoid(48);
        await kv.setex(`pwreset:${token}`, RESET_TTL_SECONDS, user.id);
        void sendPasswordReset(user.email, {
          name: user.name,
          resetUrl: `${env.FRONTEND_URL}/reset-password?token=${token}`,
        });
      }
    }
    res.json({ sent: true });
  })
);

// POST /auth/reset-password — consume the token, set the new password.
router.post(
  '/reset-password',
  rateLimit({ keyPrefix: 'reset-pw', windowSeconds: 900, max: 15 }),
  asyncHandler(async (req, res) => {
    const { token, newPassword } = z
      .object({ token: z.string().min(20).max(80), newPassword: passwordSchema })
      .parse(req.body);

    const userId = await kv.getdel(`pwreset:${token}`); // atomic: one use only
    if (!userId) throw badRequest('Reset link is invalid or expired', 'RESET_INVALID');

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
    });
    res.json({ success: true });
  })
);

export default router;
