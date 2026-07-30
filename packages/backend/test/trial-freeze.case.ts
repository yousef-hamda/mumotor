/**
 * One run of processExpiredTrials in a FRESH process, so config/env.ts and lib/stripe.ts
 * are parsed from this process's environment. Spawned by trial-freeze.check.ts — the
 * env-dependent behaviour is decided at module load, so it cannot be re-tested in-process.
 *
 * Prints "HANDLED=<n>" for the runner to read.
 *
 * NOTE the explicit process.exit: importing the app graph opens an eager ioredis
 * connection (lib/redis.ts, lazyConnect:false) which keeps the event loop alive
 * forever, so this would otherwise never exit and the parent's spawnSync would hang.
 * test/cron-check.ts exits for the same reason.
 */
import { processExpiredTrials } from '../src/services/jobs/jobService.js';
import { prisma } from '../src/lib/prisma.js';

try {
  const handled = await processExpiredTrials();
  console.log(`HANDLED=${handled}`);
  await prisma.$disconnect();
  process.exit(0);
} catch (e) {
  console.error(e);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
}
