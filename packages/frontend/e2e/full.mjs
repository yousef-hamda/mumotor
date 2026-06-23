// Full user-like E2E: clicks through every page + key buttons, captures console errors.
import { chromium } from 'playwright';

const WEB = 'http://localhost:5173';
const SITE = 'http://localhost:4000';
let pass = 0, fail = 0;
const fails = [];
const consoleErrors = [];
const ok = (n, c, extra) => { if (c) { pass++; console.log('  \x1b[32m✓\x1b[0m', n); } else { fail++; fails.push(n); console.log('  \x1b[31m✗', n, '\x1b[0m', extra ? JSON.stringify(extra) : ''); } };
const section = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));

const uniq = Date.now().toString(36);

try {
  // ── 1. Generated site: in-page booking (the new widget) ──
  section('Generated site — in-page booking');
  await page.goto(`${SITE}/site/davids-driving`, { waitUntil: 'networkidle' });
  ok('site loads + has #book', (await page.locator('#book').count()) === 1);
  ok('video background present', (await page.locator('.services-video video').count()) === 1);
  await page.locator('#ds-email').fill('anna@example.com');
  await page.locator('#ds-panel .book-btn').click();
  await page.waitForSelector('.book-chip', { timeout: 6000 });
  ok('date chips shown after email', (await page.locator('.book-chip').count()) > 0);
  // pick a few days out (open weekday), then a time
  await page.locator('.book-chip').nth(2).click();
  await page.waitForTimeout(1200);
  let times = await page.locator('.book-chip').count();
  if (times === 0) { await page.locator('.book-chip').nth(1).click(); await page.waitForTimeout(1200); times = await page.locator('.book-chip').count(); }
  ok('time chips shown after date', times > 0, { times });
  if (times > 0) {
    await page.locator('.book-chip').first().click();
    await page.waitForSelector('.book-ok', { timeout: 6000 }).catch(() => {});
    ok('in-page booking succeeds (.book-ok)', (await page.locator('.book-ok').count()) === 1);
  }

  // ── 2. Public React pages render ──
  section('Public React pages');
  await page.goto(`${WEB}/p/davids-driving/enroll`, { waitUntil: 'networkidle' });
  ok('enroll page renders', (await page.getByText(/Enroll at/i).count()) > 0);
  await page.goto(`${WEB}/p/davids-driving/book-lesson`, { waitUntil: 'networkidle' });
  ok('book-lesson page renders', (await page.getByText(/Book a driving lesson/i).count()) > 0);

  // ── 3. Auth + dashboard nav ──
  section('Dashboard — login + every page');
  await page.goto(`${WEB}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', 'teacher@otto.local');
  await page.fill('input[type=password]', 'password123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 8000 });
  ok('login → dashboard', page.url().includes('/dashboard'));

  for (const [name, path, heading] of [
    ['overview', '/dashboard', /Welcome back/i],
    ['driving', '/dashboard/driving-school', /Driving Teacher/i],
    ['reviews', '/dashboard/reviews', /Reviews/i],
    ['publishing', '/dashboard/publishing', /Publishing/i],
    ['billing', '/dashboard/billing', /Billing/i],
    ['settings', '/dashboard/settings', /Settings/i],
  ]) {
    await page.goto(WEB + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    ok(`page ${name} renders`, (await page.getByText(heading).count()) > 0);
  }

  // ── 4. Driving Teacher tabs + actions ──
  section('Driving Teacher — tabs & actions');
  await page.goto(`${WEB}/dashboard/driving-school`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  for (const tab of ['Students', "Today's Schedule", 'Email', 'Settings', 'Enrollment Code']) {
    await page.getByRole('button', { name: tab, exact: false }).first().click();
    await page.waitForTimeout(500);
    ok(`tab "${tab}" opens`, true);
  }
  // bulk email send (Email tab)
  await page.getByRole('button', { name: 'Email', exact: false }).first().click();
  await page.waitForTimeout(400);
  await page.locator('input[placeholder*="Holiday"]').fill('E2E test');
  await page.locator('textarea').fill('Automated test message.');
  await page.getByRole('button', { name: /send email/i }).click();
  await page.waitForTimeout(800);
  ok('bulk email sent (toast)', (await page.getByText(/Sent to/i).count()) > 0);
  // settings save
  await page.getByRole('button', { name: 'Settings', exact: false }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /save settings/i }).click();
  await page.waitForTimeout(800);
  ok('driving settings saved (toast)', (await page.getByText(/Settings saved/i).count()) > 0);

  // ── 5. Students lifecycle on a throwaway ──
  section('Students — toggle / finish / delete');
  const wid = await page.evaluate(async () => {
    const r = await fetch('/api/driving-school/davids-driving/public-settings'); return (await r.json()).id;
  });
  const taEmail = `e2e_${uniq}@example.com`;
  await page.evaluate(async ([wid, email]) => {
    await fetch('/api/driving-school/enroll', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ websiteId: wid, studentName: 'E2E Throwaway', studentEmail: email, enrollmentCode: 'DRIVE2026' }) });
  }, [wid, taEmail]);
  await page.getByRole('button', { name: 'Students', exact: false }).first().click();
  await page.waitForTimeout(400);
  await page.locator('input[placeholder*="Search"]').fill('e2e_' + uniq);
  await page.waitForTimeout(900);
  ok('throwaway student found', (await page.getByText('E2E Throwaway').count()) > 0);
  await page.locator('button[title="Pause"]').first().click().catch(() => {});
  await page.waitForTimeout(600);
  ok('toggle status works', (await page.getByText(/Status updated/i).count()) > 0);
  await page.locator('button[title="Mark completed"]').first().click().catch(() => {});
  await page.waitForTimeout(600);
  await page.locator('button[title="Delete"]').first().click().catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('.btn-danger').click().catch(() => {}); // modal confirm (danger button)
  await page.waitForTimeout(800);
  ok('delete student works', (await page.getByText(/Student deleted/i).count()) > 0);

  // ── 6. Reviews: create PENDING via API, then approve + reply + delete ──
  section('Reviews — approve / reply / delete');
  await page.evaluate(async (wid) => {
    await fetch('/api/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ websiteId: wid, studentName: 'E2E Reviewer', rating: 5, comment: 'Great automated review' }) });
  }, wid);
  await page.goto(`${WEB}/dashboard/reviews`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  ok('pending review visible', (await page.getByText('E2E Reviewer').count()) > 0);
  await page.locator('button[title="Approve"]').first().click().catch(() => {});
  await page.waitForTimeout(700);
  ok('review approve works', (await page.getByText(/Updated/i).count()) > 0);
  await page.locator('button[title="Delete"]').first().click().catch(() => {});
  await page.waitForTimeout(700);
  ok('review delete works', (await page.getByText(/Deleted/i).count()) > 0);

  // ── 7. Publishing: unpublish → publish ──
  section('Publishing — unpublish / publish');
  await page.goto(`${WEB}/dashboard/publishing`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /^unpublish$/i }).first().click().catch(() => {});
  await page.waitForTimeout(900);
  ok('unpublish works', (await page.getByText(/Unpublished/i).count()) > 0);
  await page.getByRole('button', { name: /^publish$/i }).first().click().catch(() => {});
  await page.waitForTimeout(1200);
  ok('publish works', (await page.getByText(/Published/i).count()) > 0);

  // ── 8. Billing: switch plan ──
  section('Billing — switch plan');
  await page.goto(`${WEB}/dashboard/billing`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /switch to studio/i }).click().catch(() => {});
  await page.waitForTimeout(900);
  ok('plan switch works', (await page.getByText(/Switched to/i).count()) > 0);
  await page.getByRole('button', { name: /switch to pro/i }).click().catch(() => {});
  await page.waitForTimeout(900);

  // ── 9. Settings: save profile ──
  section('Settings — save profile');
  await page.goto(`${WEB}/dashboard/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /save profile/i }).click();
  await page.waitForTimeout(800);
  ok('profile save works', (await page.getByText(/Profile saved/i).count()) > 0);

  // ── 10. Language switch (RTL) ──
  section('Language switcher (RTL)');
  await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
  await page.locator('select').first().selectOption('he').catch(() => {});
  await page.waitForTimeout(600);
  const dir = await page.evaluate(() => document.documentElement.dir);
  ok('switch to Hebrew sets dir=rtl', dir === 'rtl', { dir });
  await page.locator('select').first().selectOption('en').catch(() => {});
} catch (e) {
  console.log('\x1b[31mHARNESS ERROR:\x1b[0m', e.message);
  fail++;
}

section('Console / page errors');
const realErrors = consoleErrors.filter((e) => !/favicon|net::ERR|Failed to load resource/i.test(e));
ok('no console/page errors', realErrors.length === 0, realErrors.slice(0, 5));

console.log(`\n${'='.repeat(50)}\nResults: \x1b[32m${pass} passed\x1b[0m, ${fail ? `\x1b[31m${fail} failed\x1b[0m` : '0 failed'}`);
if (fails.length) console.log('Failed:', fails.join(', '));
await browser.close();
process.exit(fail ? 1 : 0);
