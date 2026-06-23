import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import { uploadsDir } from '../lib/uploads.js';

const router = Router();

const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_BYTES = 6 * 1024 * 1024; // ~6MB

// Note: verifyToken is applied per-route (not router-wide) because this router is
// mounted at the API root — a router-wide guard would 401 every unmatched /api path.

async function ownWebsite(id: string, userId: string) {
  const w = await prisma.website.findUnique({ where: { id } });
  if (!w) throw notFound('Website not found');
  if (w.userId !== userId) throw forbidden('Not your website');
  return w;
}

// POST /websites/:websiteId/media  { dataUrl, type? }
router.post(
  '/websites/:websiteId/media',
  verifyToken,
  asyncHandler(async (req, res) => {
    await ownWebsite(req.params.websiteId, req.user!.id);
    const { dataUrl, type } = z
      .object({ dataUrl: z.string().min(1), type: z.enum(['CAR_PHOTO', 'GALLERY', 'AVATAR', 'LOGO', 'OTHER']).default('GALLERY') })
      .parse(req.body);

    const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!m) throw badRequest('Invalid image data');
    const mime = m[1];
    const ext = MIME_EXT[mime];
    if (!ext) throw badRequest('Unsupported image type (png/jpg/webp/gif only)');
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > MAX_BYTES) throw badRequest('Image is too large (max 6MB)');

    const fileName = `${randomUUID()}.${ext}`;
    await writeFile(`${uploadsDir}/${fileName}`, buf);
    const url = `${env.APP_URL}/uploads/${fileName}`;

    const media = await prisma.media.create({
      data: { websiteId: req.params.websiteId, type, url, fileName, fileSize: BigInt(buf.length) },
    });
    res.status(201).json({ media: { id: media.id, url: media.url, type: media.type } });
  })
);

// GET /websites/:websiteId/media
router.get(
  '/websites/:websiteId/media',
  verifyToken,
  asyncHandler(async (req, res) => {
    await ownWebsite(req.params.websiteId, req.user!.id);
    const media = await prisma.media.findMany({
      where: { websiteId: req.params.websiteId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true, type: true, createdAt: true },
    });
    res.json({ media });
  })
);

// DELETE /media/:id
router.delete(
  '/media/:id',
  verifyToken,
  asyncHandler(async (req, res) => {
    const media = await prisma.media.findUnique({ where: { id: req.params.id }, include: { website: { select: { userId: true } } } });
    if (!media) throw notFound('Media not found');
    if (media.website.userId !== req.user!.id) throw forbidden('Not your media');
    await prisma.media.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  })
);

export default router;
