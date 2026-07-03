import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

/** Product events the funnel is measured with. Server-emitted ones are the
 *  source of truth for conversions; the client only sends wizard-funnel steps. */
export const EVENT_NAMES = [
  'wizard_started',
  'wizard_step_completed',
  'template_chosen',
  'site_published',
  'enroll_completed',
  'booking_created',
  'review_submitted',
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

/** Fire-and-forget event write — never throws, never blocks a request. */
export function logEvent(
  name: EventName,
  data?: { props?: Record<string, string | number>; sessionId?: string; userId?: string }
): void {
  prisma.analyticsEvent
    .create({
      data: {
        name,
        props: data?.props ?? undefined,
        sessionId: data?.sessionId,
        userId: data?.userId,
      },
    })
    .catch((e) => logger.warn(`analytics event dropped (${name}): ${(e as Error).message}`));
}
