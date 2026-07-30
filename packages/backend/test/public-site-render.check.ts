/**
 * A-03 / B-01 regression test — a published teacher site must identify itself, not Mumotor.
 *
 * Why this exists: `/p/:slug` is a client-rendered route, so the HTML leaving the server
 * was the shared SPA shell carrying Mumotor's own title, description and og:image. Every
 * teacher sharing their site on WhatsApp was advertising Mumotor. Non-JS search crawlers
 * saw the same empty shell while /sitemap.xml claimed those pages mattered.
 *
 * Self-contained: boots the real app in-process on an ephemeral port. No external server,
 * no built frontend required (the crawler path builds its own document). Creates and
 * removes its own site row.
 *
 * Run: npm run test:pubsite --workspace @mumotor/backend
 */
import { createServer, type Server } from 'node:http';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';
import { clearSiteCache } from '../src/lib/siteCache.js';

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
const SLUG = `ogtest-${STAMP}`;
const EMAIL = `ogtest-${STAMP}@mumotor.test`;
const SCHOOL = "Rivka's Road Academy";
const TAGLINE = 'Calm, patient driving lessons';

const BOT = 'facebookexternalhit/1.1'; // what WhatsApp actually sends
const HUMAN = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';

let server: Server;
let base: string;

const get = async (path: string, ua: string) => {
  const res = await fetch(`${base}${path}`, { headers: { 'user-agent': ua } });
  return { status: res.status, body: await res.text(), cache: res.headers.get('x-cache') };
};

/** Count occurrences of a meta tag — a crawler seeing two picks arbitrarily. */
const countTag = (html: string, attr: string, name: string) =>
  (html.match(new RegExp(`${attr}="${name}"`, 'g')) ?? []).length;

const contentOf = (html: string, attr: string, name: string) =>
  new RegExp(`<meta\\s+${attr}="${name}"\\s+content="([^"]*)"`).exec(html)?.[1] ?? '';

const cleanup = () =>
  prisma.user.deleteMany({ where: { email: { startsWith: 'ogtest-', endsWith: '@mumotor.test' } } });

async function seed() {
  return prisma.user.create({
    data: {
      email: EMAIL,
      name: 'Rivka Test',
      passwordHash: 'x',
      websites: {
        create: {
          name: SCHOOL,
          slug: SLUG,
          tagline: TAGLINE,
          status: 'PUBLISHED',
          locale: 'HE',
          publishedHtml: '<html></html>',
          publishedAt: new Date(),
          configuration: {
            teacherName: 'Rivka Levi',
            city: 'Haifa',
            pricePerClass: 170,
            classDuration: 45,
            experienceYears: '12',
            transmission: 'both',
            contact: { phone: '+972-50-000-0000', email: 'rivka@example.com' },
            plans: [{ name: '10-lesson package', price: 1600, period: 'total', features: ['Door-to-door pickup'] }],
            areas: [{ name: 'Haifa' }, { name: 'Krayot' }],
          },
          settings: { create: { businessHours: { sunday: { isOpen: true, open: '09:00', close: '17:00' } } } },
          reviews: {
            create: [{ studentName: 'Noa', rating: 5, comment: 'Passed first time.', status: 'APPROVED' }],
          },
        },
      },
    },
  });
}

async function main() {
  await cleanup();
  console.log('\nA-03 / B-01 — a teacher site must identify itself, not Mumotor\n');

  const app = createApp();
  server = createServer(app);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const addr = server.address();
  base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;

  await seed();
  await clearSiteCache(SLUG); // a previous run's cache must not decide this one

  // ── The crawler that breaks sharing today ───────────────────────────────────────
  console.log('  crawler (WhatsApp / Facebook — never runs JavaScript)');
  const bot = await get(`/p/${SLUG}`, BOT);
  check('responds 200', bot.status === 200, String(bot.status));
  check("<title> is the SCHOOL's, not Mumotor's", bot.body.includes(SCHOOL) && !/<title>Mumotor/.test(bot.body));
  // Compare against the escaped form: the school name contains an apostrophe and the
  // renderer escapes `'` → `&#39;` (safe inside either quote style). A test that expected
  // the raw name would be asserting an escaping bug.
  const escSchool = SCHOOL.replace(/'/g, '&#39;');
  check(
    'og:title carries the school + tagline (apostrophe correctly escaped)',
    contentOf(bot.body, 'property', 'og:title').includes(escSchool) &&
      contentOf(bot.body, 'property', 'og:title').includes(TAGLINE)
  );
  check(
    'og:description is about this school (no Mumotor marketing copy)',
    /Rivka|Haifa/.test(contentOf(bot.body, 'property', 'og:description')) &&
      !/booking for driving instructors/.test(contentOf(bot.body, 'property', 'og:description'))
  );
  check(
    'og:url points at THIS site, not the Mumotor homepage',
    contentOf(bot.body, 'property', 'og:url').endsWith(`/p/${SLUG}`),
    contentOf(bot.body, 'property', 'og:url')
  );
  check(
    'og:image is absolute and not the Mumotor hero',
    /^https?:\/\//.test(contentOf(bot.body, 'property', 'og:image')) &&
      !contentOf(bot.body, 'property', 'og:image').includes('hero-drive'),
    contentOf(bot.body, 'property', 'og:image')
  );
  check('exactly one og:title (no ambiguity)', countTag(bot.body, 'property', 'og:title') === 1);
  check('document language follows the site (he)', /<html[^>]+lang="he"/.test(bot.body));
  check('RTL direction set for Hebrew', /<html[^>]+dir="rtl"/.test(bot.body));

  // ── Readable content, so non-JS search crawlers can index the site (B-01) ───────
  console.log('\n  crawler content parity');
  check('real <h1> with the school name', new RegExp(`<h1>[^<]*Rivka`).test(bot.body));
  check('the instructor name appears in the body', bot.body.includes('Rivka Levi'));
  check('packages and price are indexable', bot.body.includes('10-lesson package') && bot.body.includes('1600'));
  check('areas covered are indexable', bot.body.includes('Krayot'));
  check('opening hours are indexable', bot.body.includes('09:00'));
  check('approved review is indexable', bot.body.includes('Passed first time'));
  check('DrivingSchool JSON-LD present', bot.body.includes('"@type":"DrivingSchool"'));
  check('aggregateRating derived from the real review', bot.body.includes('aggregateRating'));
  check(
    'no fabricated content: unset fields are simply absent',
    !bot.body.includes('undefined') && !bot.body.includes('null')
  );

  // ── The human must still get the working app ────────────────────────────────────
  console.log('\n  human visitor');
  const human = await get(`/p/${SLUG}`, HUMAN);
  check('responds 200', human.status === 200, String(human.status));
  // With no built frontend/dist this path intentionally falls through to the SPA, so
  // assert personalisation only when a shell was actually available to personalise.
  const shellServed = human.body.includes('id="root"');
  if (shellServed) {
    check('still the single-page app (has #root and the module script)', /<script type="module"/.test(human.body));
    check("shell <head> personalised to the school", human.body.includes(SCHOOL));
    check('exactly one <title>', (human.body.match(/<title>/g) ?? []).length === 1);
    check('exactly one manifest link', countTag(human.body, 'rel', 'manifest') === 1);
    check('manifest points at this teacher', human.body.includes(`/site/${SLUG}/manifest.webmanifest`));
  } else {
    console.log('  \x1b[33m•\x1b[0m no built frontend/dist — human path correctly fell through to the SPA');
  }

  // ── Caching, and the states that must NOT be personalised ───────────────────────
  console.log('\n  caching + edge cases');
  const again = await get(`/p/${SLUG}`, BOT);
  check('second crawler request is a cache HIT', again.cache === 'HIT', String(again.cache));
  check('cached body is identical', again.body === bot.body);

  // A cached shell from a PREVIOUS build must never be served: it embeds hashed asset
  // filenames (/assets/index-<hash>.js) that no longer exist, so the browser gets HTML
  // back for a script request and the teacher's site renders blank and unstyled. This bug
  // shipped once and was caught by e2e/lazy-routes; the fingerprint stamp is the guard.
  if (shellServed) {
    const { kv } = await import('../src/lib/redis.js');
    await kv.setex(
      `pmeta:${SLUG}`,
      60,
      'deadbeefcafe\n<html><head><script src="/assets/index-OLDHASH.js"></script></head><body>stale</body></html>'
    );
    const afterDeploy = await get(`/p/${SLUG}`, HUMAN);
    check(
      'a shell cached by an older build is discarded, not served',
      !afterDeploy.body.includes('index-OLDHASH') && !afterDeploy.body.includes('stale'),
      'served a stale-build shell — assets would 404'
    );
    check('and it re-renders fresh', afterDeploy.cache === 'MISS' && afterDeploy.body.includes(SCHOOL));
  }

  await prisma.website.update({ where: { slug: SLUG }, data: { status: 'SUSPENDED' } });
  await clearSiteCache(SLUG); // exactly what freezeUserSites does
  const frozen = await get(`/p/${SLUG}`, BOT);
  check(
    'a SUSPENDED site does not serve the teacher content',
    !frozen.body.includes(TAGLINE),
    'frozen site leaked its tagline'
  );

  await prisma.website.update({ where: { slug: SLUG }, data: { status: 'DRAFT' } });
  await clearSiteCache(SLUG);
  const draft = await get(`/p/${SLUG}`, BOT);
  check('a DRAFT site is not indexable', !draft.body.includes(TAGLINE));

  const unknown = await get('/p/no-such-school-here', BOT);
  check('unknown slug does not 500', unknown.status < 500, String(unknown.status));
  check('unknown slug leaks no school data', !unknown.body.includes(SCHOOL));

  await cleanup();
  await clearSiteCache(SLUG);
  server.close();
  console.log(`\n${pass} passed, ${fail} failed\n`);
  await prisma.$disconnect();
  process.exit(fail ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await cleanup().catch(() => {});
  server?.close();
  await prisma.$disconnect();
  process.exit(1);
});
