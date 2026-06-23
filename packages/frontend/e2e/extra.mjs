// E2E for the newly added features: media upload, notifications, admin panel.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const WEB = 'http://localhost:5173';
let pass = 0, fail = 0;
const fails = [];
const ok = (n, c, x) => { if (c) { pass++; console.log('  \x1b[32m✓\x1b[0m', n); } else { fail++; fails.push(n); console.log('  \x1b[31m✗', n, '\x1b[0m', x ? JSON.stringify(x) : ''); } };
const section = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m');
const heroImg = fileURLToPath(new URL('../public/img/ai-hero.png', import.meta.url));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));

async function loginAs(email) {
  await page.goto(`${WEB}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', email);
  await page.fill('input[type=password]', 'password123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(1500);
}

try {
  // ── Admin panel ──
  section('Admin panel');
  await loginAs('admin@otto.local');
  await page.goto(`${WEB}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  ok('admin sees Platform overview', (await page.getByText(/Platform overview/i).count()) > 0);
  ok('admin stats render (Teachers)', (await page.getByText(/Teachers/i).count()) > 0);
  ok('admin websites table has davids', (await page.getByText(/davids-driving/i).count()) > 0);
  // non-admin is blocked
  await page.evaluate(() => localStorage.removeItem('otto_token'));
  await loginAs('teacher@otto.local');
  await page.goto(`${WEB}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  ok('teacher blocked from /admin', (await page.getByText(/Not authorized/i).count()) > 0);

  // ── Notifications ── (trigger one via API enroll, then check the bell)
  section('Notifications');
  const wid = await page.evaluate(async () => {
    const r = await fetch('/api/driving-school/davids-driving/public-settings'); return (await r.json()).id;
  });
  await page.evaluate(async (wid) => {
    await fetch('/api/driving-school/enroll', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ websiteId: wid, studentName: 'Notif Tester', studentEmail: `notif_${Date.now()}@example.com`, enrollmentCode: 'DRIVE2026' }) });
  }, wid);
  await page.goto(`${WEB}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200); // let the bell poll
  await page.locator('button[aria-label="Notifications"]').click();
  await page.waitForTimeout(600);
  ok('notification dropdown opens', (await page.getByText(/Notifications/).count()) > 0);
  ok('enrollment notification present', (await page.getByText(/New student enrolled/i).count()) > 0);

  // ── Media upload (editor cover photo) ──
  section('Media upload');
  await page.goto(`${WEB}/dashboard`, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: /edit site/i }).first().click();
  await page.waitForSelector('iframe[title="Preview"]', { timeout: 12000 });
  await page.waitForTimeout(1500);
  await page.locator('input[type=file]').first().setInputFiles(heroImg);
  await page.waitForTimeout(2500);
  ok('cover photo upload succeeds', (await page.getByText(/Cover photo updated/i).count()) > 0);
} catch (e) {
  console.log('\x1b[31mHARNESS ERROR:\x1b[0m', e.message);
  fail++;
}

section('Page errors');
ok('no page errors', consoleErrors.length === 0, consoleErrors.slice(0, 4));

console.log(`\n${'='.repeat(46)}\nResults: \x1b[32m${pass} passed\x1b[0m, ${fail ? `\x1b[31m${fail} failed\x1b[0m` : '0 failed'}`);
if (fails.length) console.log('Failed:', fails.join(', '));
await browser.close();
process.exit(fail ? 1 : 0);
