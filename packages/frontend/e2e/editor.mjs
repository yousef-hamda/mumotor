// Drives the visual editor: open, live-edit, verify preview updates.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://localhost:5173';
const OUT = new URL('./shots/editor/', import.meta.url).pathname;
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const shot = async (n) => { await page.waitForTimeout(500); await page.screenshot({ path: `${OUT}${n}.png` }); console.log('  ✓', n); };

// login
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.fill('input[type=email]', 'teacher@otto.local');
await page.fill('input[type=password]', 'password123');
await page.getByRole('button', { name: /sign in/i }).click();
await page.waitForURL('**/dashboard', { timeout: 8000 });
await page.waitForTimeout(600);

// open editor
await page.getByRole('link', { name: /edit site/i }).first().click();
await page.waitForSelector('iframe[title="Preview"]', { timeout: 12000 });
await page.waitForTimeout(2000);
await shot('1-editor');

// live edit the tagline (input directly follows its label)
const tagline = page.locator('label:has-text("Tagline") + input');
await tagline.fill('Drive with total confidence');
await page.waitForTimeout(1800); // debounced regen
await shot('2-edited');

// read the iframe to confirm the new tagline rendered
const frame = page.frameLocator('iframe[title="Preview"]');
const h1 = await frame.locator('h1').first().textContent().catch(() => '');
console.log('preview H1 now:', JSON.stringify(h1));

await browser.close();
console.log('editor E2E done');
