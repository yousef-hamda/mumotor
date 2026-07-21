// Exercises the billing money-path end-to-end against the local DB:
// getAccountState (trial / expired / paid), freezeUserSites, and the
// quota-capped restoreUserSites. Run: npm run test:billing (tsx, direct DB).
import { prisma } from '../src/lib/prisma.js';
import { getAccountState } from '../src/services/billing/accountState.js';
import { freezeUserSites, restoreUserSites } from '../src/services/billing/siteFreeze.js';

let passed = 0;
let failed = 0;
function ok(name: string, cond: boolean, extra?: unknown) {
  if (cond) {
    passed += 1;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    failed += 1;
    console.log(`  \x1b[31m✗\x1b[0m ${name}`, extra ?? '');
  }
}

const DAY = 24 * 60 * 60 * 1000;
const stamp = Date.now();

async function main() {
  const user = await prisma.user.create({
    data: {
      email: `billing-check-${stamp}@test.local`,
      passwordHash: 'x',
      name: 'Billing Check',
      subscription: { create: { plan: 'FREE', status: 'ACTIVE', trialEndsAt: new Date(stamp + 10 * DAY) } },
    },
  });

  try {
    console.log('\x1b[1mAccount state — trial\x1b[0m');
    let state = await getAccountState(user.id);
    ok('fresh trial account is not locked', !state.locked && state.onTrial);
    ok('trial quota is 1', state.quota === 1 && state.canAddWebsite);

    console.log('\x1b[1mAccount state — trial expired\x1b[0m');
    await prisma.subscription.update({ where: { userId: user.id }, data: { trialEndsAt: new Date(stamp - DAY) } });
    state = await getAccountState(user.id);
    ok('expired trial locks the account', state.locked && !state.onTrial);
    ok('expired trial quota is 0', state.quota === 0 && !state.canAddWebsite);

    console.log('\x1b[1mAccount state — paid\x1b[0m');
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { plan: 'PRO', status: 'ACTIVE', websiteQuota: 2 },
    });
    state = await getAccountState(user.id);
    ok('paid account is unlocked', !state.locked && state.paid);
    ok('paid quota follows websiteQuota (2)', state.quota === 2);
    await prisma.subscription.update({ where: { userId: user.id }, data: { status: 'PAST_DUE' } });
    state = await getAccountState(user.id);
    ok('PAST_DUE keeps the grace period (still paid)', state.paid && !state.locked);
    await prisma.subscription.update({ where: { userId: user.id }, data: { status: 'ACTIVE' } });

    console.log('\x1b[1mFreeze / restore — quota-capped\x1b[0m');
    const mk = (n: number) =>
      prisma.website.create({
        data: {
          userId: user.id,
          name: `Billing Check ${n}`,
          slug: `billing-check-${stamp}-${n}`,
          status: 'PUBLISHED',
          publishedHtml: '<html></html>',
        },
      });
    const w1 = await mk(1);
    const w2 = await mk(2);

    const frozen = await freezeUserSites(user.id);
    ok('freeze suspends every published site', frozen === 2);
    const statuses = await prisma.website.findMany({ where: { userId: user.id }, select: { status: true } });
    ok('frozen sites are SUSPENDED', statuses.every((s) => s.status === 'SUSPENDED'));

    await prisma.subscription.update({ where: { userId: user.id }, data: { websiteQuota: 1 } });
    let restored = await restoreUserSites(user.id);
    ok('restore honours the quota (1 of 2 comes back)', restored === 1);
    const oldest = await prisma.website.findUnique({ where: { id: w1.id }, select: { status: true } });
    ok('the oldest site is restored first', oldest?.status === 'PUBLISHED');

    await prisma.subscription.update({ where: { userId: user.id }, data: { websiteQuota: 2 } });
    restored = await restoreUserSites(user.id);
    ok('raising the quota restores the rest', restored === 1);
    const second = await prisma.website.findUnique({ where: { id: w2.id }, select: { status: true } });
    ok('the second site is back online', second?.status === 'PUBLISHED');

    console.log('\x1b[1mLapsed paid account\x1b[0m');
    await prisma.subscription.update({ where: { userId: user.id }, data: { status: 'CANCELED', plan: 'FREE' } });
    state = await getAccountState(user.id);
    ok('cancelled + trial over → locked again', state.locked && state.quota === 0);
    restored = await restoreUserSites(user.id);
    ok('restore is a no-op with zero quota', restored === 0);
  } finally {
    await prisma.user.delete({ where: { id: user.id } }); // cascades websites + subscription
    await prisma.$disconnect();
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\x1b[1mResults: \x1b[32m${passed} passed\x1b[0m, ${failed === 0 ? '0' : `\x1b[31m${failed}\x1b[0m`} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('billing check failed:', e);
  process.exit(1);
});
