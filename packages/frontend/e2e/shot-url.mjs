// Screenshot any URL (http or file). Usage: node e2e/shot-url.mjs <url> <outPath> [mobile]
import { chromium } from 'playwright';

const [, , url, out, mode] = process.argv;
const viewport = mode === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
// force any scroll-reveal elements visible so the full-page shot shows everything
await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
await page.waitForTimeout(1200);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('shot →', out);
