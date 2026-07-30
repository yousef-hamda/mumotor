import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { startCronJobs } from './services/jobs/jobService.js';

async function main() {
  // Verify DB connectivity early.
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (err) {
    logger.error('Failed to connect to the database', (err as Error).message);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`🚗 Mumotor API listening on http://localhost:${env.PORT}`);
    logger.info(`   Health: http://localhost:${env.PORT}/api/health`);
  });

  startCronJobs();

  /**
   * Graceful shutdown (G-03). `server.close()` was called without awaiting it, so a deploy
   * could cut off requests that were mid-flight — including a student's booking, which
   * would leave them unsure whether the lesson was taken. Now we stop accepting new
   * connections, let in-flight work finish, and only then disconnect.
   *
   * Capped: a hung request must not block the deploy forever, so we force-exit after a
   * grace period. The platform sends SIGKILL eventually anyway; exiting first keeps the
   * log honest about what happened.
   */
  const SHUTDOWN_GRACE_MS = 10_000;
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return; // a second signal must not race the first
    shuttingDown = true;
    logger.info(`${signal} received, finishing in-flight requests...`);

    const forced = setTimeout(() => {
      logger.warn(`shutdown grace period elapsed after ${SHUTDOWN_GRACE_MS}ms — exiting anyway`);
      process.exit(0);
    }, SHUTDOWN_GRACE_MS);
    forced.unref(); // don't let the timer itself hold the process open

    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
    clearTimeout(forced);
    logger.info('shutdown complete');
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Fatal startup error', err);
  process.exit(1);
});
