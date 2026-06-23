import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { slugify } from '../utils/slug.js';
import { PRESET_SUMMARIES, getPreset } from '../services/ai/templatePresets.js';
import { generateWebsite } from '../services/ai/generator.js';
import type { GeneratedSiteConfig } from '../services/ai/templateBuilder.js';

const router = Router();

// GET /ai/v2/quick-templates — the 9 driving presets (for the design step)
router.get('/quick-templates', (_req, res) => {
  res.json({ presets: PRESET_SUMMARIES });
});

// POST /ai/v2/generate-website — deterministic preview build (no persistence)
const genSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  presetId: z.string().optional(),
  businessConfig: z.record(z.any()).optional(),
});
router.post(
  '/generate-website',
  rateLimit({ keyPrefix: 'generate', windowSeconds: 60, max: 20 }),
  asyncHandler(async (req, res) => {
    const data = genSchema.parse(req.body);
    const config = (data.businessConfig ?? {}) as GeneratedSiteConfig;
    const name = data.name || config.teacherName || 'My Driving School';
    const slug = slugify(name);
    const preset = getPreset(data.presetId);

    const { html, metadata } = generateWebsite({
      website: { name, slug },
      config,
      presetId: preset.id,
    });

    res.json({ html, metadata, presetId: preset.id, slug });
  })
);

// POST /ai/v2/regenerate-section — rebuild with a (possibly) different preset/config
router.post(
  '/regenerate-section',
  rateLimit({ keyPrefix: 'regenerate', windowSeconds: 60, max: 30 }),
  asyncHandler(async (req, res) => {
    const data = genSchema.parse(req.body);
    const config = (data.businessConfig ?? {}) as GeneratedSiteConfig;
    const name = data.name || config.teacherName || 'My Driving School';
    const { html, metadata } = generateWebsite({
      website: { name, slug: slugify(name) },
      config,
      presetId: data.presetId,
    });
    res.json({ html, metadata, presetId: getPreset(data.presetId).id });
  })
);

export default router;
