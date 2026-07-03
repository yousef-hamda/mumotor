import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { EVENT_NAMES, logEvent, type EventName } from '../services/analytics.js';

const router = Router();

const eventSchema = z.object({
  name: z.enum(EVENT_NAMES as unknown as [EventName, ...EventName[]]),
  props: z.record(z.union([z.string().max(200), z.number()])).optional(),
  sessionId: z.string().max(64).optional(),
});

// POST /events — public, fire-and-forget product event. Responds 204 fast;
// the write happens in the background. Auth is optional (best-effort userId).
router.post(
  '/',
  rateLimit({ keyPrefix: 'events', windowSeconds: 60, max: 60 }),
  asyncHandler(async (req, res) => {
    const data = eventSchema.parse(req.body);
    if (JSON.stringify(data.props ?? {}).length > 1024) {
      res.status(204).end(); // silently drop oversized props
      return;
    }

    let userId: string | undefined;
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        userId = (jwt.verify(auth.slice(7), env.JWT_SECRET) as { id?: string }).id;
      } catch {
        /* anonymous is fine */
      }
    }

    logEvent(data.name, { props: data.props, sessionId: data.sessionId, userId });
    res.status(204).end();
  })
);

export default router;
