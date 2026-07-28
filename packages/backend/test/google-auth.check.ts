// Exercises the Google Sign-In account-resolution logic against the local DB:
// create / idempotent / link-by-email. No live Google call — feeds a fake verified
// payload straight into upsertGoogleUser. Run: npm run test:google (tsx, direct DB).
import { prisma } from '../src/lib/prisma.js';
import { upsertGoogleUser } from '../src/services/auth/googleAuth.js';
import { getAccountState } from '../src/services/billing/accountState.js';
import bcrypt from 'bcryptjs';

let passed = 0;
let failed = 0;
function ok(name: string, cond: boolean, extra?: unknown) {
  if (cond) { passed += 1; console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  else { failed += 1; console.log(`  \x1b[31m✗\x1b[0m ${name}`, extra ?? ''); }
}

const stamp = Date.now();
const newEmail = `gauth-new-${stamp}@test.local`;
const linkEmail = `gauth-link-${stamp}@test.local`;

async function main() {
  const createdIds: string[] = [];
  try {
    console.log('\x1b[1mGoogle sign-in — brand new account\x1b[0m');
    const u1 = await upsertGoogleUser({ email: newEmail, sub: `g-${stamp}-1`, name: 'Grace Google', picture: 'https://pic/a.jpg' });
    createdIds.push(u1.id);
    ok('creates the account', !!u1.id && u1.email === newEmail);
    ok('links the googleId', u1.googleId === `g-${stamp}-1`);
    ok('email is marked verified (Google verified it)', u1.emailVerified === true);
    ok('no local password (password-less account)', u1.passwordHash === null);
    ok('stores the avatar', u1.avatarUrl === 'https://pic/a.jpg');
    const st = await getAccountState(u1.id);
    ok('gets the free-month trial (not locked, quota 1)', st.onTrial && !st.locked && st.quota === 1, st);

    console.log('\x1b[1mIdempotent — same Google identity signs in again\x1b[0m');
    const u1b = await upsertGoogleUser({ email: newEmail, sub: `g-${stamp}-1`, name: 'Grace Google', picture: 'https://pic/a.jpg' });
    ok('returns the SAME user (no duplicate)', u1b.id === u1.id);
    const count = await prisma.user.count({ where: { email: newEmail } });
    ok('exactly one row for that email', count === 1, count);

    console.log('\x1b[1mLink — Google email matches an existing PASSWORD account\x1b[0m');
    const existing = await prisma.user.create({
      data: { email: linkEmail, passwordHash: await bcrypt.hash('Sup3rSecret!', 10), name: 'Pass User' },
    });
    createdIds.push(existing.id);
    const linked = await upsertGoogleUser({ email: linkEmail, sub: `g-${stamp}-2`, name: 'Pass User', picture: null });
    ok('links onto the existing account (same id)', linked.id === existing.id);
    ok('googleId attached', linked.googleId === `g-${stamp}-2`);
    ok('existing password is preserved', linked.passwordHash === existing.passwordHash);
    ok('existing account now email-verified', linked.emailVerified === true);

    console.log('\x1b[1mCase-insensitive email\x1b[0m');
    const u3 = await upsertGoogleUser({ email: newEmail.toUpperCase(), sub: `g-${stamp}-1`, name: 'Grace', picture: null });
    ok('uppercased email resolves to the same account', u3.id === u1.id);
  } finally {
    await prisma.user.deleteMany({ where: { email: { in: [newEmail, linkEmail] } } });
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`\x1b[1mResults: \x1b[32m${passed} passed\x1b[0m, ${failed ? `\x1b[31m${failed} failed\x1b[0m` : '0 failed'}`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
