import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { kv } from '../lib/redis.js';
import { env } from '../config/env.js';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { forbidden, notFound } from '../utils/errors.js';
import { slugify } from '../utils/slug.js';
import { DEFAULTS } from '../services/scheduling/schedulingService.js';
import { generateWebsite, configToSiteConfig } from '../services/ai/generator.js';
import { getPreset } from '../services/ai/templatePresets.js';

const router = Router();

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (await prisma.website.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

const defaultBusinessHours = {
  monday: { isOpen: true, open: '08:00', close: '18:00' },
  tuesday: { isOpen: true, open: '08:00', close: '18:00' },
  wednesday: { isOpen: true, open: '08:00', close: '18:00' },
  thursday: { isOpen: true, open: '08:00', close: '18:00' },
  friday: { isOpen: true, open: '08:00', close: '14:00' },
  saturday: { isOpen: false, open: '09:00', close: '14:00' },
  sunday: { isOpen: true, open: '09:00', close: '16:00' },
};

const createSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(2).max(48).optional(),
  tagline: z.string().max(160).optional(),
  selectedPreset: z.string().max(40).optional(),
  locale: z.enum(['HE', 'AR', 'EN']).optional(),
  configuration: z.record(z.any()).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  tagline: z.string().max(160).optional(),
  selectedPreset: z.string().max(40).optional(),
  locale: z.enum(['HE', 'AR', 'EN']).optional(),
  configuration: z.record(z.any()).optional(),
});

router.use(verifyToken);

async function loadOwned(id: string, userId: string) {
  const website = await prisma.website.findUnique({ where: { id }, include: { settings: true } });
  if (!website) throw notFound('Website not found');
  if (website.userId !== userId) throw forbidden('Not your website');
  return website;
}

// GET /websites — list my sites
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const websites = await prisma.website.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { enrollments: true, bookings: true } } },
    });
    res.json({ websites });
  })
);

// POST /websites — create a site (draft) + default settings + default service
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const slug = await ensureUniqueSlug(slugify(data.slug || data.name));

    const website = await prisma.website.create({
      data: {
        userId: req.user!.id,
        name: data.name.trim(),
        slug,
        tagline: data.tagline?.trim(),
        businessCategory: 'DRIVING_SCHOOL',
        status: 'DRAFT',
        selectedPreset: data.selectedPreset ?? getPreset().id,
        locale: data.locale ?? 'HE',
        configuration: {
          classDuration: DEFAULTS.classDuration,
          advanceBookingDays: 14,
          bookingCutoffHour: DEFAULTS.bookingCutoffHour,
          dailyCodeEnabled: true,
          breakTimes: [],
          ...(data.configuration ?? {}),
        },
        settings: { create: { businessHours: defaultBusinessHours } },
        services: { create: { name: 'Driving Lesson', duration: DEFAULTS.classDuration, price: 0 } },
      },
      include: { settings: true },
    });

    res.status(201).json({ website });
  })
);

// GET /websites/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const website = await prisma.website.findUnique({
      where: { id: req.params.id },
      include: { settings: true, _count: { select: { enrollments: true, bookings: true } } },
    });
    if (!website) throw notFound('Website not found');
    if (website.userId !== req.user!.id) throw forbidden('Not your website');
    res.json({ website });
  })
);

// PATCH /websites/:id — update name/tagline/preset/configuration (editor autosave)
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const existing = await loadOwned(req.params.id, req.user!.id);

    const merged = data.configuration
      ? { ...(existing.configuration as object), ...data.configuration }
      : undefined;

    const website = await prisma.website.update({
      where: { id: req.params.id },
      data: {
        name: data.name,
        tagline: data.tagline,
        selectedPreset: data.selectedPreset,
        locale: data.locale,
        ...(merged ? { configuration: merged } : {}),
      },
      include: { settings: true },
    });
    res.json({ website });
  })
);

// POST /websites/:id/publish — (re)generate with the real slug, cache, snapshot
router.post(
  '/:id/publish',
  asyncHandler(async (req, res) => {
    const website = await loadOwned(req.params.id, req.user!.id);

    const config = configToSiteConfig(website.configuration as Record<string, unknown>);
    const { html } = generateWebsite({
      website: { id: website.id, name: website.name, slug: website.slug },
      config,
      presetId: website.selectedPreset,
    });

    const version = (await prisma.websiteVersion.count({ where: { websiteId: website.id } })) + 1;
    await prisma.$transaction([
      prisma.website.update({
        where: { id: website.id },
        data: {
          status: 'PUBLISHED',
          publishedHtml: html,
          publishedAt: new Date(),
          configuration: { ...(website.configuration as object), generatedHTML: html },
        },
      }),
      prisma.websiteVersion.create({ data: { websiteId: website.id, version, html } }),
    ]);

    await kv.del(`site:${website.slug}`);

    res.json({
      status: 'PUBLISHED',
      slug: website.slug,
      path: `/site/${website.slug}`,
      url: `${env.APP_URL}/site/${website.slug}`,
      subdomain: `${website.slug}.mumotor.com`,
      version,
    });
  })
);

// POST /websites/:id/unpublish
router.post(
  '/:id/unpublish',
  asyncHandler(async (req, res) => {
    const website = await loadOwned(req.params.id, req.user!.id);
    await prisma.website.update({ where: { id: website.id }, data: { status: 'DRAFT' } });
    await kv.del(`site:${website.slug}`);
    res.json({ status: 'DRAFT' });
  })
);

export default router;
