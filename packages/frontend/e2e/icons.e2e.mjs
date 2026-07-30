/**
 * C-01 regression test — the full lucide library must not load on a normal page visit,
 * and every template icon must still render.
 *
 * Why this exists: DynamicIcon used `import * as Lucide from 'lucide-react'`, so all
 * ~1,540 icons landed in the chunk every visitor downloads — including a student on
 * mobile data who only wanted to book a lesson. The picker only ever offered ~130 curated
 * icons, so the rest supported nothing. The fix imports those names explicitly and keeps
 * the full library behind a lazy import used only for a stale stored icon name.
 *
 * This asserts the OUTCOME (what the browser actually fetches), not the implementation:
 *   1. no lucide chunk is requested while loading a published teacher site
 *   2. icons still render as real <svg> with path data, not empty fallbacks
 *
 * Run against a server serving the built dist:
 *   WEB=http://localhost:4123 SLUG=davids-driving node packages/frontend/e2e/icons.e2e.mjs
 */
import { chromium } from 'playwright';

const WEB = process.env.WEB || 'http://localhost:4123';
const SLUG = process.env.SLUG || 'davids-driving';

let pass = 0;
let fail = 0;
const check = (label, ok, detail = '') => {
  if (ok) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    fail++;
    console.log(`  \x1b[31m✗\x1b[0m ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

const browser = await chromium.launch();
const page = await browser.newPage();

const requested = [];
page.on('request', (r) => requested.push(r.url()));
const consoleErrors = [];
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push(String(e)));

console.log('\nC-01 — the icon library must not ship to every visitor\n');

await page.goto(`${WEB}/p/${SLUG}`, { waitUntil: 'networkidle' });
// Templates reveal on scroll; settle the page so every icon has mounted.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1200);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);

const jsRequests = requested.filter((u) => u.endsWith('.js'));
const lucideChunks = jsRequests.filter((u) => /lucide/i.test(u));

check(
  'no lucide chunk fetched on a normal teacher-site visit',
  lucideChunks.length === 0,
  lucideChunks.join(', ')
);

const totalJsBytes = await page.evaluate(() =>
  performance
    .getEntriesByType('resource')
    .filter((r) => r.name.endsWith('.js'))
    .reduce((sum, r) => sum + (r.encodedBodySize || r.transferSize || 0), 0)
);
console.log(`  \x1b[90m·\x1b[0m JavaScript actually transferred: ${(totalJsBytes / 1024).toFixed(0)} KB across ${jsRequests.length} files`);

// Icons must still be real, rendered SVGs — a silent fallback would look "fine" but wrong.
const icons = await page.evaluate(() => {
  const svgs = [...document.querySelectorAll('svg.lucide, svg[class*="lucide"]')];
  return {
    count: svgs.length,
    withGeometry: svgs.filter((s) => s.querySelector('path,circle,line,rect,polyline,polygon')).length,
    distinctShapes: new Set(svgs.map((s) => s.innerHTML)).size,
  };
});
check('template icons rendered', icons.count > 0, `found ${icons.count}`);
check(
  'every icon has real geometry (not an empty placeholder)',
  icons.count > 0 && icons.withGeometry === icons.count,
  `${icons.withGeometry}/${icons.count}`
);
check(
  'icons are visually distinct (not all collapsed to the Circle fallback)',
  icons.distinctShapes >= 3,
  `${icons.distinctShapes} distinct`
);
check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
