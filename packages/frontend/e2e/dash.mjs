import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const OUT = new URL('./shots/dash/', import.meta.url).pathname;
await mkdir(OUT, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await p.fill('input[type=email]', 'teacher@otto.local');
await p.fill('input[type=password]', 'password123');
await p.getByRole('button', { name: /sign in/i }).click();
await p.waitForURL('**/dashboard', { timeout: 8000 });
for (const [name, path] of [['billing','/dashboard/billing'],['reviews','/dashboard/reviews'],['publishing','/dashboard/publishing'],['settings','/dashboard/settings']]) {
  await p.goto('http://localhost:5173'+path, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  await p.screenshot({ path: OUT+name+'.png' });
  console.log('  ✓', name);
}
await b.close();
