import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { kv } from '../lib/redis.js';
import { env } from '../config/env.js';
import { verifyToken } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError, badRequest, forbidden, notFound } from '../utils/errors.js';
import { getAccountState, WEBSITE_PRICE } from '../services/billing/accountState.js';
import { slugify } from '../utils/slug.js';
import { DEFAULTS } from '../services/scheduling/schedulingService.js';
import { generateWebsite, configToSiteConfig } from '../services/ai/generator.js';
import { logEvent } from '../services/analytics.js';
import { getPreset } from '../services/ai/templatePresets.js';
import { boundedRecord } from '../utils/validation.js';

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
  configuration: boundedRecord().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  tagline: z.string().max(160).optional(),
  selectedPreset: z.string().max(40).optional(),
  locale: z.enum(['HE', 'AR', 'EN']).optional(),
  configuration: boundedRecord().optional(),
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
      include: { _count: { select: { enrollments: true, bookings: { where: { status: { not: 'CANCELLED' } } } } } },
    });
    res.json({ websites });
  })
);

// POST /websites — create a site (draft) + default settings + default service
router.post(
  '/',
  rateLimit({ keyPrefix: 'website-create', windowSeconds: 3600, max: 30, keyFn: (req) => req.user?.id ?? req.ip ?? 'anon' }),
  asyncHandler(async (req, res) => {
    // One website per account on the free plan; extra sites are ₪199/mo each.
    const state = await getAccountState(req.user!.id);
    if (!state.canAddWebsite) {
      throw new ApiError(
        402,
        state.locked
          ? `Your free month has ended. Subscribe for ₪${WEBSITE_PRICE}/month to keep your website online.`
          : `Your plan includes ${state.quota} website${state.quota === 1 ? '' : 's'}. Additional websites are ₪${WEBSITE_PRICE}/month each.`,
        'PAYMENT_REQUIRED'
      );
    }

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
          advanceBookingDays: 1, // students book for the next day only
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
      include: { settings: true, _count: { select: { enrollments: true, bookings: { where: { status: { not: 'CANCELLED' } } } } } },
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

    // Same rule as publish + every drivingSchool write: a locked (unpaid)
    // account only manages billing — it doesn't keep editing sites.
    const state = await getAccountState(req.user!.id);
    if (state.locked) {
      throw new ApiError(
        402,
        `Your free month has ended. Subscribe for ₪${WEBSITE_PRICE}/month to keep editing your website.`,
        'PAYMENT_REQUIRED'
      );
    }

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
  // Expensive: full HTML regen + versioned snapshot + cache eviction. Cap per account.
  rateLimit({ keyPrefix: 'publish', windowSeconds: 600, max: 30, keyFn: (req) => req.user?.id ?? req.ip ?? 'anon' }),
  asyncHandler(async (req, res) => {
    const website = await loadOwned(req.params.id, req.user!.id);

    // A locked account (free month over, not subscribed) cannot (re)publish.
    const state = await getAccountState(req.user!.id);
    if (state.locked) {
      throw new ApiError(
        402,
        `Your free month has ended. Subscribe for ₪${WEBSITE_PRICE}/month to publish your website.`,
        'PAYMENT_REQUIRED'
      );
    }

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
    // PWA manifest/icon are derived from the same branding — drop them too.
    await Promise.all([
      kv.del(`manifest:${website.slug}:path`),
      kv.del(`manifest:${website.slug}:sub`),
      kv.del(`icon:${website.slug}`),
    ]);

    logEvent('site_published', { userId: req.user!.id, props: { template: website.selectedPreset ?? 'unknown' } });

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
    // PWA manifest/icon are derived from the same branding — drop them too.
    await Promise.all([
      kv.del(`manifest:${website.slug}:path`),
      kv.del(`manifest:${website.slug}:sub`),
      kv.del(`icon:${website.slug}`),
    ]);
    res.json({ status: 'DRAFT' });
  })
);

// DELETE /websites/:id — permanently delete a website and ALL its data.
// Requires a typed confirmation ("DELETE") in the body. Cascades to settings,
// services, enrollments, bookings, daily codes, reviews, media, versions.
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const website = await loadOwned(req.params.id, req.user!.id);
    if (String(req.body?.confirm ?? '').trim().toUpperCase() !== 'DELETE') {
      throw badRequest('Type DELETE to confirm permanent deletion', 'CONFIRM_REQUIRED');
    }
    await prisma.website.delete({ where: { id: website.id } });
    await kv.del(`site:${website.slug}`);
    // PWA manifest/icon are derived from the same branding — drop them too.
    await Promise.all([
      kv.del(`manifest:${website.slug}:path`),
      kv.del(`manifest:${website.slug}:sub`),
      kv.del(`icon:${website.slug}`),
    ]);
    res.json({ deleted: true });
  })
);

export default router;
