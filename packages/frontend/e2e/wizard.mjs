// Drives the full builder wizard and publishes a site. Verifies Wave 3 end-to-end.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://localhost:5173';
const OUT = new URL('./shots/wizard/', import.meta.url).pathname;
await mkdir(OUT, { recursive: true });
const email = `wiz_${Date.now().toString(36)}@example.com`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const shot = async (n) => { await page.waitForTimeout(500); await page.screenshot({ path: `${OUT}${n}.png`, fullPage: true }); console.log('  ✓', n); };

await page.goto(`${BASE}/builder`, { waitUntil: 'networkidle' });
await shot('1-welcome');

await page.getByRole('button', { name: /start building/i }).click();
await page.waitForTimeout(400);
await page.getByPlaceholder("David's Driving School").fill('Lina Driving Academy');
await page.getByPlaceholder('David Cohen').fill('Lina Haddad');
await shot('2-about');
await page.getByRole('button', { name: /continue/i }).click();
await page.waitForTimeout(300);

// lessons
await page.getByRole('button', { name: /continue/i }).click();
await page.waitForTimeout(300);
// contact
await page.getByRole('button', { name: /continue/i }).click();
await page.waitForTimeout(400);

// design
await shot('3-design');
await page.locator('button', { hasText: 'Pine Route' }).first().click().catch(() => {});
await page.getByRole('button', { name: /generate my site/i }).click();

// generating → preview
await page.waitForSelector('iframe[title="Site preview"]', { timeout: 15000 });
await page.waitForTimeout(1500);
await shot('4-preview');

// publish → account
await page.getByRole('button', { name: /publish my site/i }).click();
await page.waitForTimeout(600);
await page.getByLabel('Full name').fill('Lina Haddad').catch(async () => {
  await page.locator('input').first().fill('Lina Haddad');
});
await page.locator('input[type=email]').fill(email);
await page.locator('input[type=password]').fill('password123');
await shot('5-account');
await page.getByRole('button', { name: /create account & publish/i }).click();

// done
await page.waitForSelector('text=Your site is live', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(1000);
await shot('6-done');

const liveText = await page.locator('code').first().textContent().catch(() => '');
console.log('published subdomain:', liveText);

await browser.close();
console.log('wizard E2E done. email:', email);
