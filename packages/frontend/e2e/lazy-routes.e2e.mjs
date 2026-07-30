/**
 * C-01 companion test — every lazily-split route must still load and render.
 *
 * Splitting the teacher route trees out of the main chunk is only safe if each one still
 * resolves at runtime. A missing Suspense boundary or a bad dynamic path shows up as a
 * blank screen or a console error, not a build failure — so assert it in a real browser.
 *
 * Also asserts the point of the split: a STUDENT visiting a published site must not
 * download the dashboard/builder/admin chunks.
 *
 * Run: WEB=http://localhost:4123 node packages/frontend/e2e/lazy-routes.e2e.mjs
 */
import { chromium } from 'playwright';

const WEB = process.env.WEB || 'http://localhost:4123';
const SLUG = process.env.SLUG || 'davids-driving';
const EMAIL = process.env.EMAIL || 'teacher@mumotor.local';
const PASSWORD = process.env.PASSWORD || 'password123';

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
const ctx = await browser.newContext();
const page = await ctx.newPage();

const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

/** Wait until the page has real content, not just the Suspense placeholder. */
async function settle() {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}
const visibleText = () => page.evaluate(() => document.body.innerText.trim().length);

console.log('\nC-01 companion — lazily-split routes must still work\n');

// ── A student's journey must not pull teacher code ───────────────────────────────
const studentRequests = [];
page.on('request', (r) => studentRequests.push(r.url()));
await page.goto(`${WEB}/p/${SLUG}`, { waitUntil: 'networkidle' });
await settle();
check('published teacher site renders', (await visibleText()) > 200);
const teacherChunks = studentRequests.filter((u) =>
  /(Dashboard|DrivingSchool|BuilderWizard|CustomizePage|AdminDashboard|Billing|Publishing)-/.test(u)
);
check(
  'student does not download dashboard/builder/admin chunks',
  teacherChunks.length === 0,
  teacherChunks.map((u) => u.split('/').pop()).join(', ')
);

// ── Public marketing + gallery ──────────────────────────────────────────────────
console.log('\n  public routes');
for (const [path, label] of [
  ['/', 'landing'],
  ['/login', 'login'],
  ['/register', 'register'],
  ['/templates', 'templates gallery (lazy)'],
  ['/templates/mumotor', 'template preview (lazy)'],
  ['/404', 'not found'],
]) {
  await page.goto(`${WEB}${path}`, { waitUntil: 'domcontentloaded' });
  await settle();
  check(`${label} renders`, (await visibleText()) > 50, `${await visibleText()} chars`);
}

// ── Authenticated teacher routes, all lazy ──────────────────────────────────────
console.log('\n  teacher routes (all lazy)');
await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded' });
await settle();
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(/\/dashboard/, { timeout: 20000 }).catch(() => {});
await settle();
check('login lands on the dashboard (lazy chunk resolved)', /\/dashboard/.test(page.url()), page.url());
check('dashboard has content', (await visibleText()) > 100);

for (const [path, label] of [
  ['/dashboard/driving-school', 'driving school'],
  ['/dashboard/reviews', 'reviews'],
  ['/dashboard/messages', 'messages'],
  ['/dashboard/publishing', 'publishing'],
  ['/dashboard/billing', 'billing'],
  ['/dashboard/settings', 'settings'],
  ['/builder', 'builder wizard'],
] ) {
  await page.goto(`${WEB}${path}`, { waitUntil: 'domcontentloaded' });
  await settle();
  const chars = await visibleText();
  check(`${label} renders`, chars > 80, `${chars} chars`);
}

check('no console errors across every route', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
