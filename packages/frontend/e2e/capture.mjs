// Screenshot harness for visual review. Usage:
//   node e2e/capture.mjs [tag]
// Captures the full app (public + authed) at desktop and mobile sizes into e2e/shots/<tag>/.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.WEB_BASE || 'http://localhost:5173';
const TAG = process.argv[2] || 'shots';
const OUT = new URL(`./shots/${TAG}/`, import.meta.url).pathname;
await mkdir(OUT, { recursive: true });

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

async function shoot(page, name) {
  try {
    await page.waitForTimeout(700); // let entrance motion settle
    // reveal any scroll-animated elements so the full-page shot shows everything
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${OUT}${name}.png`, fullPage: true });
    console.log('  ✓', name);
  } catch (e) {
    console.log('  ✗', name, e.message);
  }
}

async function gotoSafe(page, path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' }).catch(() => {});
}

async function run(viewport, suffix) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  // public pages
  for (const [name, path] of [
    ['landing', '/'],
    ['login', '/login'],
    ['register', '/register'],
    ['public-site', '/p/davids-driving'],
    ['enroll', '/p/davids-driving/enroll'],
    ['book-lesson', '/p/davids-driving/book-lesson'],
  ]) {
    await gotoSafe(page, path);
    await shoot(page, `${name}${suffix}`);
  }

  // login then authed pages
  await gotoSafe(page, '/login');
  await page.fill('input[type=email]', 'teacher@otto.local').catch(() => {});
  await page.fill('input[type=password]', 'password123').catch(() => {});
  await page.getByRole('button', { name: /sign in/i }).click().catch(() => {});
  await page.waitForURL('**/dashboard', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(500);
  await shoot(page, `dashboard${suffix}`);

  await gotoSafe(page, '/dashboard/driving-school');
  await page.waitForTimeout(800);
  await shoot(page, `ds-code${suffix}`);
  for (const [name, label] of [
    ['ds-students', 'Students'],
    ['ds-schedule', "Today's Schedule"],
    ['ds-email', 'Email'],
    ['ds-settings', 'Settings'],
  ]) {
    await page.getByRole('button', { name: label, exact: false }).first().click().catch(() => {});
    await page.waitForTimeout(700);
    await shoot(page, `${name}${suffix}`);
  }

  await browser.close();
}

console.log(`Capturing → ${OUT}`);
console.log('Desktop:');
await run(DESKTOP, '');
console.log('Mobile:');
await run(MOBILE, '-m');
console.log('Done.');
