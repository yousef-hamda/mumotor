import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest } from '../utils/errors.js';

const router = Router();
router.use(verifyToken);

// The config blob is the frontend's WizardConfig, stored opaquely (one per user).
const MAX_CONFIG_BYTES = 200 * 1024; // photos are data-URLs; cap abuse without breaking normal drafts

// GET /wizard-draft
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const draft = await prisma.wizardDraft.findUnique({
      where: { userId: req.user!.id },
      select: { config: true, updatedAt: true },
    });
    res.json({ draft });
  })
);

// PUT /wizard-draft — upsert the user's single draft
router.put(
  '/',
  // Autosave-friendly but bounded (per user) so it can't be used as a write flood.
  rateLimit({ keyPrefix: 'wizard-draft', windowSeconds: 60, max: 120, keyFn: (req) => req.user?.id ?? req.ip ?? 'anon' }),
  asyncHandler(async (req, res) => {
    const { config } = z.object({ config: z.record(z.unknown()) }).parse(req.body);
    if (JSON.stringify(config).length > MAX_CONFIG_BYTES) {
      throw badRequest('Draft is too large to save', 'DRAFT_TOO_LARGE');
    }
    const draft = await prisma.wizardDraft.upsert({
      where: { userId: req.user!.id },
      update: { config: config as object },
      create: { userId: req.user!.id, config: config as object },
      select: { updatedAt: true },
    });
    res.json({ saved: true, updatedAt: draft.updatedAt });
  })
);

// DELETE /wizard-draft
router.delete(
  '/',
  asyncHandler(async (req, res) => {
    await prisma.wizardDraft.deleteMany({ where: { userId: req.user!.id } });
    res.json({ deleted: true });
  })
);

export default router;
