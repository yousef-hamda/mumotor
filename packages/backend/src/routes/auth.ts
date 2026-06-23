import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signToken, verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, conflict, unauthorized } from '../utils/errors.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(u: { id: string; email: string; name: string; phone: string | null; preferredLanguage?: string; role?: string }) {
  return { id: u.id, email: u.email, name: u.name, phone: u.phone, preferredLanguage: u.preferredLanguage, role: u.role };
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

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: data.name.trim(), phone: data.phone?.trim() },
    });

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
      .object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })
      .parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw unauthorized('Account not found');
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw badRequest('Current password is incorrect', 'BAD_PASSWORD');
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
    res.json({ success: true });
  })
);

export default router;
