// E2E for the new template gallery, data wizard, wide preview, Customize mode + published site.
// Backend on :4000, frontend dev server on WEB (default :5174). Run: node e2e/features.e2e.mjs
import { chromium } from 'playwright';

const WEB = process.env.WEB || 'http://localhost:5174';
let pass = 0, fail = 0;
const fails = [];
const consoleErrors = [];
const ok = (n, c, extra) => { if (c) { pass++; console.log('  \x1b[32m✓\x1b[0m', n); } else { fail++; fails.push(n); console.log('  \x1b[31m✗', n, '\x1b[0m', extra ? JSON.stringify(extra) : ''); } };
const section = (t) => console.log('\n\x1b[1m' + t + '\x1b[0m');
const clickText = async (page, re) => page.evaluate((src) => {
  const rx = new RegExp(src, 'i');
  const b = [...document.querySelectorAll('button, a, [role="button"]')].find((x) => rx.test(x.textContent || ''));
  if (b) b.click();
  return !!b;
}, re.source);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));
page.on('dialog', (d) => d.accept());

try {
  // ── 1. Template gallery ──
  section('Template gallery (/templates)');
  await page.goto(`${WEB}/templates`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('a[href^="/templates/"]', { timeout: 8000 });
  const cards = await page.locator('a[href^="/templates/"]').count();
  ok('shows 18 template cards', cards === 18, { cards });
  ok('cards use animated concept previews (.tc-root)', (await page.locator('a[href^="/templates/"] .tc-root').count()) >= 18);

  // ── 2. Live template preview ──
  section('Template preview (/templates/:slug)');
  await page.goto(`${WEB}/templates/solari`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.tmpl-solari', { timeout: 8000 });
  ok('solari template renders', (await page.locator('.tmpl-solari').count()) === 1);
  ok('hero headline present', (await page.locator('[data-edit="hero.headline"]').count()) >= 1);
  ok('switcher chrome "Use this" present', (await page.getByText(/Use this/i).count()) >= 1);

  // ── 2b. Glass + premium templates render (smoke + no horizontal overflow) ──
  section('Glass + premium templates');
  for (const slug of ['mumotor', 'meridian', 'bezel', 'solari', 'cadence', 'circuit', 'press', 'reel', 'slate', 'primary', 'gallery', 'gilt', 'sumi', 'console', 'transit', 'ledger']) {
    await page.goto(`${WEB}/templates/${slug}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(`.tmpl-${slug}`, { timeout: 8000 });
    ok(`${slug} renders`, (await page.locator(`.tmpl-${slug}`).count()) === 1);
    ok(`${slug} has hero headline`, (await page.locator('[data-edit="hero.headline"]').count()) >= 1);
    ok(`${slug} booking CTA present`, (await page.locator(`#book`).count()) >= 1);
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(`${slug} no horizontal overflow`, ov <= 1, { ov });
  }

  // ── 3. Builder: data collection ──
  section('Builder — data collection + auto-fill');
  await page.goto(`${WEB}/builder`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('mumotor_wizard'));
  await page.goto(`${WEB}/builder`, { waitUntil: 'domcontentloaded' });
  ok('start building button', await clickText(page, /start building/));
  await page.waitForTimeout(300);
  ok('on Business step', (await page.getByText(/Tell us about you/i).count()) > 0);
  ok('auto-fill clicked', await clickText(page, /auto-fill sample/));
  await page.waitForTimeout(300);
  const bizName = await page.locator('input').first().inputValue();
  ok('auto-fill populated business name', bizName.length > 0, { bizName });

  ok('continue to setup', await clickText(page, /continue/));
  await page.waitForTimeout(300);
  ok('on Setup step', (await page.getByText(/Set up your lessons/i).count()) > 0);
  ok('schedule section', (await page.getByText(/Schedule & availability/i).count()) > 0);
  ok('experience cards', (await page.getByText(/10\+ years/i).count()) > 0);
  ok('car photo upload', (await page.getByText(/A photo of your car/i).count()) > 0);
  ok('your-photo upload (instructor)', (await page.getByText(/A photo of you/i).count()) > 0);
  ok('transmission cards', (await page.getByText(/Transmission/i).count()) > 0 && (await page.getByRole('button', { name: 'Automatic' }).count()) > 0);
  ok('plans editor + Add plan', (await page.getByText(/Plans \/ packages/i).count()) > 0 && (await page.getByText(/Add plan/i).count()) > 0);
  ok('10 social platform buttons', (await page.getByText(/^Snapchat$/).count()) > 0 && (await page.getByText(/^Telegram$/).count()) > 0);

  ok('continue to Templates gallery', await clickText(page, /choose a design/));
  await page.waitForTimeout(300);
  ok('Templates step shows 12 animated concept cards', (await page.locator('.tc-root').count()) >= 12);

  // ── 4. Pick a template → instant live Design step ──
  section('Builder — pick → instant live preview');
  ok('pick Solari card', await clickText(page, /Solari/));
  await page.waitForSelector('.tmpl-solari', { timeout: 8000 });
  ok('selected template renders live instantly', (await page.locator('.tmpl-solari').count()) === 1);
  ok('no separate "preview" button', (await page.getByText(/preview my site/i).count()) === 0);
  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2);
  ok('no horizontal overflow (nothing clipped)', noOverflow);
  ok('choose-another-template control present', (await page.getByText(/choose another template/i).count()) > 0);
  ok('booking section is a CTA (no multi-step widget)', await page.evaluate(() => {
    const book = document.getElementById('book');
    return !!book && !/choose a date|choose a time/i.test(book.textContent || '');
  }));
  ok('no marquee anywhere', (await page.locator('.gi-marquee, .ft-marquee').count()) === 0);
  ok('Customize + Publish buttons present', (await page.getByText(/Customize/).count()) > 0 && (await page.getByText(/Publish my site/i).count()) > 0);

  // ── 5. Customize mode (inline + popover, no side panel) ──
  section('Customize mode (inline)');
  ok('enter customize', await clickText(page, /Customize/));
  await page.waitForSelector('text=Editing Mode', { timeout: 8000 });
  ok('toolbar "Editing Mode" present', (await page.getByText(/Editing Mode/).count()) > 0);
  ok('no right side panel', (await page.locator('aside').count()) === 0);

  // click headline → inline editable + text-colour popover
  await page.locator('[data-edit="hero.headline"]').first().click();
  await page.waitForTimeout(250);
  ok('headline becomes editable inline', (await page.locator('[data-edit="hero.headline"][contenteditable="true"]').count()) === 1);
  ok('text-colour popover appears', (await page.getByText(/Type to edit the text/i).count()) > 0);
  // type new text + set its colour
  await page.evaluate(() => { document.querySelector('[data-edit="hero.headline"]').innerText = 'E2E HEADLINE'; });
  await page.evaluate(() => {
    const ci = document.querySelector('div.fixed input[type="color"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(ci, '#ff0000'); ci.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(250);
  ok('text colour applied live', await page.evaluate(() => getComputedStyle(document.querySelector('[data-edit="hero.headline"]')).color === 'rgb(255, 0, 0)'));

  // click background (page root) → palette popover
  await page.evaluate(() => { document.querySelector('[data-edit="theme.bg"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await page.waitForTimeout(250);
  ok('background palette popover appears', (await page.getByText(/Colours/i).count()) > 0);
  ok('palette colour edited', await page.evaluate(() => {
    const ci = document.querySelector('div.fixed input[type="color"]');
    if (!ci) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(ci, '#101522'); ci.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }));

  // list add via hover controls — scroll first (lets the scroll event clear hover), then move.
  // Uses `areas` (a Customize-editable list). NOTE: packages are intentionally NOT
  // add/remove-editable in Customize (the wizard PlansEditor is their source of truth).
  await page.evaluate(() => document.querySelector('[data-edit-item^="areas."]').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  const beforeAreas = await page.locator('[data-edit-item^="areas."]').count();
  await page.evaluate(() => { const el = document.querySelector('[data-edit-item^="areas."]'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r.left + 12, clientY: r.top + 12 })); });
  await page.waitForTimeout(250);
  ok('hover add control appears', (await page.locator('button[title="Add item"]').count()) > 0);
  await page.locator('button[title="Add item"]').first().click();
  await page.waitForTimeout(300);
  ok('area added via hover +', (await page.locator('[data-edit-item^="areas."]').count()) === beforeAreas + 1);

  // remove a list item via hover trash
  await page.evaluate(() => { const el = document.querySelector('[data-edit-item^="areas."]'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r.left + 12, clientY: r.top + 12 })); });
  await page.waitForTimeout(250);
  const beforeRemove = await page.locator('[data-edit-item^="areas."]').count();
  ok('hover remove control appears', (await page.locator('button[title="Remove item"]').count()) > 0);
  await page.locator('button[title="Remove item"]').first().click();
  await page.waitForTimeout(250);
  ok('area removed via hover trash', (await page.locator('[data-edit-item^="areas."]').count()) === beforeRemove - 1);

  // packages ARE add/removable in Customize (edits fold back into `plans` on save)
  await page.evaluate(() => document.querySelector('[data-edit-item^="packages."]')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await page.evaluate(() => { const el = document.querySelector('[data-edit-item^="packages."]'); if (el) { const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r.left + 12, clientY: r.top + 12 })); } });
  await page.waitForTimeout(250);
  ok('packages expose add control (synced to plans on save)', (await page.locator('button[title="Add item"]').count()) > 0);

  // ── new: social icons + credentials are deletable/draggable items ──
  ok('social icons are deletable items', (await page.locator('[data-edit-item^="contact.socials."]').count()) >= 1);
  ok('credential badges are deletable items', (await page.locator('[data-edit-item^="instructor.credentials."]').count()) >= 1);
  {
    const beforeSoc = await page.locator('[data-edit-item^="contact.socials."]').count();
    await page.locator('[data-edit-item^="contact.socials."]').first().scrollIntoViewIfNeeded();
    await page.locator('[data-edit-item^="contact.socials."]').first().hover();
    await page.waitForTimeout(200);
    await page.locator('button[title="Remove item"]').first().click();
    await page.waitForTimeout(250);
    ok('social icon deleted via trash', (await page.locator('[data-edit-item^="contact.socials."]').count()) === beforeSoc - 1);
  }

  // ── new: drag-to-reorder within a group (grip dragstart → drop on sibling) ──
  {
    const names = () => page.evaluate(() => [...document.querySelectorAll('[data-edit^="areas."][data-edit$=".name"]')].map((e) => e.textContent));
    const order0 = await names();
    await page.locator('[data-edit-item^="areas."]').first().scrollIntoViewIfNeeded();
    await page.locator('[data-edit-item^="areas."]').first().hover();
    await page.waitForTimeout(150);
    const didDrag = await page.evaluate(() => {
      const items = [...document.querySelectorAll('[data-edit-item^="areas."]')];
      const grip = document.querySelector('button[title="Drag to reorder"]');
      if (!grip || items.length < 2) return false;
      const dt = new DataTransfer();
      grip.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
      const target = items[1];
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
      return true;
    });
    await page.waitForTimeout(250);
    const order1 = await names();
    ok('drag-reorder swaps item order', didDrag && order0.length >= 2 && order0.length === order1.length && order0[0] === order1[1] && order1[0] === order0[1]);
  }

  // edit a list-item text inline (package name)
  await page.locator('[data-edit="packages.0.name"]').first().click();
  await page.waitForTimeout(200);
  ok('package name editable inline', (await page.locator('[data-edit="packages.0.name"][contenteditable="true"]').count()) >= 1);
  await page.evaluate(() => { document.querySelector('[data-edit="packages.0.name"]').innerText = 'E2E PLAN'; });

  // ── #3: edit a previously-hardcoded heading (copy.*) inline ──
  const copyEl = await page.locator('[data-edit^="copy."]').first();
  if (await copyEl.count()) {
    const copyPath = await copyEl.getAttribute('data-edit');
    await page.evaluate(() => document.querySelector('[data-edit^="copy."]').scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(200);
    await page.evaluate(() => { const el = document.querySelector('[data-edit^="copy."]'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + 5, clientY: r.top + 5 })); });
    await page.waitForTimeout(200);
    ok('hardcoded copy text becomes editable inline', (await page.locator(`[data-edit="${copyPath}"][contenteditable="true"]`).count()) >= 1);
    await page.evaluate(() => { document.querySelector('[data-edit^="copy."]').innerText = 'E2E COPY'; });
    await page.evaluate(() => document.querySelector('[data-edit^="copy."]').blur());
    await page.waitForTimeout(150);
  } else { ok('hardcoded copy text becomes editable inline', false, 'no copy.* element'); }

  // ── #3: swap an icon via the icon library picker ──
  await page.evaluate(() => document.querySelector('[data-edit-type="icon"]').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(200);
  await page.evaluate(() => { const el = document.querySelector('[data-edit-type="icon"]'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + 4, clientY: r.top + 4 })); });
  await page.waitForTimeout(250);
  ok('icon library picker appears', (await page.getByText(/Choose an icon/i).count()) > 0);
  await page.evaluate(() => { const s = document.querySelector('input[placeholder="Search icons…"]'); const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(s, 'Rocket'); s.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(200);
  ok('icon search filters the library', (await page.locator('button[title="Rocket"]').count()) > 0);
  await page.locator('button[title="Rocket"]').first().click();
  await page.waitForTimeout(300);
  ok('icon swapped live (rocket)', (await page.locator('[data-edit-type="icon"].lucide-rocket').count()) >= 1);

  // ── #3: a CTA button selects-to-edit (text + Fill colour) instead of navigating ──
  await page.evaluate(() => document.querySelector('[data-edit="hero.ctaPrimary"]').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(200);
  await page.evaluate(() => { const el = document.querySelector('[data-edit="hero.ctaPrimary"]'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + 6, clientY: r.top + 6 })); });
  await page.waitForTimeout(200);
  ok('button shows Fill colour control', (await page.getByText(/Fill/i).count()) > 0);
  await page.evaluate(() => { const inputs = [...document.querySelectorAll('div.fixed input[type="color"]')]; const fill = inputs[inputs.length - 1]; const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(fill, '#7c3aed'); fill.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(250);
  ok('button fill colour applied live', await page.evaluate(() => getComputedStyle(document.querySelector('[data-edit="hero.ctaPrimary"]')).backgroundColor === 'rgb(124, 58, 237)'));

  // ── #3: "Colours" toolbar button opens the background/theme panel ──
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Colours'); b?.click(); });
  await page.waitForTimeout(200);
  ok('Colours toolbar opens theme panel', (await page.getByText(/Background & colours/i).count()) > 0);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Colours'); b?.click(); });
  await page.waitForTimeout(150);

  // replace an image via the image popover (URL field)
  await page.evaluate(() => document.querySelector('[data-edit="hero.image"]').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('[data-edit="hero.image"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(250);
  ok('image popover (Upload + Find) appears', (await page.getByText(/Find/i).count()) > 0 && (await page.getByText(/Upload/i).count()) > 0);
  ok('image popover has no paste-URL field (removed)', (await page.locator('div.fixed input.input').count()) === 0);
  // replace the hero image via Upload (the paste-URL field was removed by design)
  await page.locator('div.fixed input[type=file]').setInputFiles({ name: 'x.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64') });
  await page.waitForTimeout(400);
  ok('hero image replaced live (upload)', await page.evaluate(() => (document.querySelector('[data-edit="hero.image"]')?.getAttribute('src') || '').startsWith('data:image')));

  // Save persists everything to wizard config
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Save/.test(x.textContent || '')); b?.click(); });
  await page.waitForTimeout(300);
  ok('Save persists text + colour + list + image overrides', await page.evaluate(() => {
    const w = JSON.parse(localStorage.getItem('mumotor_wizard') || '{}');
    const c = w.customization || {};
    return c.fields?.['hero.headline'] === 'E2E HEADLINE'
      && (c.styles?.['hero.headline']?.color || '').toLowerCase() === '#ff0000'
      && (c.fields?.['hero.image'] || '').startsWith('data:image')
      // package edits are FOLDED INTO plans on save (single source of truth), and the
      // packages override is cleared — so no fields.packages, and plans holds the edit.
      && !c.fields?.['packages']
      && Array.isArray(w.plans) && w.plans[0]?.name === 'E2E PLAN';
  }));
  ok('Save persists copy + icon + button-fill overrides (#3)', await page.evaluate(() => {
    const c = JSON.parse(localStorage.getItem('mumotor_wizard') || '{}').customization || {};
    const copyKey = Object.keys(c.fields || {}).find((k) => k.startsWith('copy.'));
    const iconKey = Object.keys(c.fields || {}).find((k) => k.startsWith('icons.'));
    return !!copyKey && c.fields[copyKey] === 'E2E COPY'
      && !!iconKey && c.fields[iconKey] === 'Rocket'
      && (c.styles?.['hero.ctaPrimary']?.background || '').toLowerCase() === '#7c3aed';
  }));

  // reset clears overrides
  await page.evaluate(() => document.querySelector('button[title="Reset all changes"]')?.click());
  await page.waitForTimeout(200);
  ok('reset reverts to original headline', await page.evaluate(() => !/E2E HEADLINE/.test(document.querySelector('[data-edit="hero.headline"]')?.innerText || '')));

  // done
  ok('Done returns to preview', await clickText(page, /Done/));
  await page.waitForTimeout(300);
  ok('back on the live design step', (await page.locator('.tmpl-solari').count()) >= 1);

  // ── 6. Published site renders a template ──
  section('Published site (/p/:slug)');
  await page.goto(`${WEB}/p/davids-driving`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[class^="tmpl-"], [class*=" tmpl-"]', { timeout: 8000 });
  ok('published site renders a template', (await page.locator('[class*="tmpl-"]').count()) >= 1);
  ok('Book section links to the real booking page', (await page.locator('#book a[href$="/book-lesson"]').count()) >= 1);
  ok('footer has brand-icon SVGs (social)', (await page.locator('#contact a[aria-label] svg').count()) >= 1);
  ok('published site has no marquee', (await page.locator('.gi-marquee, .ft-marquee').count()) === 0);

  // ── 7. Console errors ──
  section('No console errors');
  ok('zero console/page errors across the run', consoleErrors.length === 0, { consoleErrors: consoleErrors.slice(0, 5) });

} catch (e) {
  fail++; fails.push('EXCEPTION: ' + e.message);
  console.error('\x1b[31mEXCEPTION\x1b[0m', e);
} finally {
  await browser.close();
  console.log(`\n\x1b[1mResults:\x1b[0m ${pass} passed, ${fail} failed`);
  if (fail) { console.log('Failures:', fails.join(' | ')); process.exit(1); }
  process.exit(0);
}
