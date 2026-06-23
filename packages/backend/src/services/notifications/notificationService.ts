import type { NotificationType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';

/** Create an in-dashboard notification for a teacher (fire-and-forget safe). */
export async function createNotification(
  userId: string,
  data: { type: NotificationType; title: string; body?: string }
): Promise<void> {
  try {
    await prisma.notification.create({ data: { userId, ...data } });
  } catch (err) {
    logger.warn('notification create failed', (err as Error).message);
  }
}
