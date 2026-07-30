/**
 * A-01 regression test — the trial-expiry job must never freeze an account that has
 * no way to pay.
 *
 * Why this exists: `processExpiredTrials` used to freeze unconditionally. In production
 * with no Stripe price configured, POST /subscriptions/checkout returns 503, so a frozen
 * teacher's site went dark, their dashboard locked, and the "Subscribe" button in the
 * email could not work — with no self-service route back and no admin grant path.
 *
 * The guard is decided at module load (config/env + lib/stripe), so each case runs in a
 * FRESH child process via trial-freeze.case.ts. Testing it in-process would silently
 * reuse the first case's config and pass for the wrong reason.
 *
 * Run: npm run test:trial --workspace @mumotor/backend
 * Needs the local Postgres (same as test:billing). Creates and removes its own rows.
 */
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail = '') {
  if (ok) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    fail++;
    console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const STAMP = Date.now();
const EMAIL = `trialfreeze-${STAMP}@mumotor.test`;
const SLUG = `trialfreeze-${STAMP}`;

/** Run processExpiredTrials in a fresh process with the given extra env; → handled count. */
function runJob(extraEnv: Record<string, string | undefined>): number {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined) env[k] = v;
  // Start from a clean billing slate so a developer's own .env can't skew the result.
  delete env.STRIPE_SECRET_KEY;
  delete env.STRIPE_PRICE_PRO;
  delete env.STRIPE_PRICE_STUDIO;
  delete env.STRIPE_PRICE_WEBSITE;
  for (const [k, v] of Object.entries(extraEnv)) {
    if (v === undefined) delete env[k];
    else env[k] = v;
  }
  // The repo-local tsx binary directly — `npx tsx` adds several seconds of resolution
  // per spawn and this runs the child three times.
  const backendDir = new URL('..', import.meta.url).pathname;
  const r = spawnSync(`${backendDir}/../../node_modules/.bin/tsx`, ['test/trial-freeze.case.ts'], {
    cwd: backendDir,
    env,
    encoding: 'utf8',
  });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const m = /HANDLED=(\d+)/.exec(out);
  if (!m) {
    console.log(`    (child produced no HANDLED line)\n${out.slice(0, 900)}`);
    return -1;
  }
  return Number(m[1]);
}

async function seed() {
  return prisma.user.create({
    data: {
      email: EMAIL,
      name: 'Trial Freeze Test',
      passwordHash: 'x',
      // Expired yesterday, never notified → exactly the row the job looks for.
      subscription: {
        create: {
          plan: 'FREE',
          status: 'TRIALING',
          websiteQuota: 1,
          trialEndsAt: new Date(Date.now() - 24 * 3600 * 1000),
        },
      },
      websites: {
        create: {
          name: 'Trial Freeze Test School',
          slug: SLUG,
          status: 'PUBLISHED',
          publishedHtml: '<html></html>',
          publishedAt: new Date(),
        },
      },
    },
  });
}

// Sweep this run AND any orphan left by an interrupted earlier run — otherwise those
// stale expired trials get picked up by case 2 (the job is global) and inflate its count.
const cleanup = () =>
  prisma.user.deleteMany({ where: { email: { startsWith: 'trialfreeze-', endsWith: '@mumotor.test' } } });

async function statusOf(userId: string) {
  const w = await prisma.website.findFirst({ where: { userId }, select: { status: true } });
  return w?.status;
}

// A prod-shaped env needs a real JWT_SECRET or config/env.ts exits — unrelated to this test.
const PROD = { NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(48), ENABLE_CRON: 'false' };

async function main() {
  await cleanup();
  console.log('\nA-01 — trial freeze must be gated on billing being configured\n');

  const user = await seed();
  check('seeded a PUBLISHED site on an expired FREE trial', (await statusOf(user.id)) === 'PUBLISHED');

  // ── Case 1: production, NO Stripe price → must not freeze, must not stamp ────────
  console.log('\n  case 1 — production, billing unconfigured');
  const handledNoPrice = runJob(PROD);
  check('job reports 0 handled', handledNoPrice === 0, `got ${handledNoPrice}`);
  check('site is STILL PUBLISHED (not frozen)', (await statusOf(user.id)) === 'PUBLISHED');
  const subAfter = await prisma.subscription.findUnique({ where: { userId: user.id } });
  check(
    'trialExpiredNotifiedAt NOT stamped — account stays claimable once billing is live',
    subAfter?.trialExpiredNotifiedAt === null,
    String(subAfter?.trialExpiredNotifiedAt)
  );
  check('plan/status untouched', subAfter?.plan === 'FREE' && subAfter?.status === 'TRIALING');

  // ── Case 2: billing configured → the paywall must still work ────────────────────
  console.log('\n  case 2 — production, billing configured');
  const handledWithPrice = runJob({
    ...PROD,
    STRIPE_SECRET_KEY: 'sk_test_placeholder',
    STRIPE_WEBHOOK_SECRET: 'whsec_placeholder', // prod config requires this alongside the key
    STRIPE_PRICE_PRO: 'price_placeholder',
  });
  // >= 1, not == 1: a seeded dev database legitimately holds other expired FREE trials,
  // and the job is global. Our own account is asserted specifically on the next lines.
  check('job handles at least the expired account', handledWithPrice >= 1, `got ${handledWithPrice}`);
  check('site is now SUSPENDED (paywall intact)', (await statusOf(user.id)) === 'SUSPENDED');
  const subFinal = await prisma.subscription.findUnique({ where: { userId: user.id } });
  check('trialExpiredNotifiedAt stamped', subFinal?.trialExpiredNotifiedAt !== null);

  // ── Case 3: the admin escape hatch brings a frozen site back ────────────────────
  console.log('\n  case 3 — admin entitlement grant');
  const { restoreUserSites } = await import('../src/services/billing/siteFreeze.js');
  await prisma.subscription.update({
    where: { userId: user.id },
    data: { plan: 'PRO', status: 'ACTIVE', websiteQuota: 1 },
  });
  const restored = await restoreUserSites(user.id);
  check('grant restores the frozen site', restored === 1 && (await statusOf(user.id)) === 'PUBLISHED');

  await cleanup();
  console.log(`\n${pass} passed, ${fail} failed\n`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await cleanup().catch(() => {});
  await prisma.$disconnect();
  process.exit(1);
});
