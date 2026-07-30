/**
 * D-12 regression test — a teacher must be able to correct a student's details.
 *
 * There was no edit path at all: only finish, pause and delete. A typo in an email meant
 * that student could not log in or get reminders, and the only remedy was delete-and-re-add,
 * which wipes their whole lesson history. `notes` was settable once in the add form and
 * never again, making the one place to record anything about a student useless.
 *
 * Drives the real dashboard, and checks the Hebrew UI too — the strings are new in three
 * locales, and a missing key renders as a raw dotted path rather than failing a build.
 *
 * Run: WEB=http://localhost:4123 node packages/frontend/e2e/edit-student.e2e.mjs
 */
import { chromium } from 'playwright';

const WEB = process.env.WEB || 'http://localhost:4123';
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
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

console.log('\nD-12 — a student\'s details must be correctable\n');

await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded' });
await page.fill('input[type="email"]', EMAIL);
await page.fill('input[type="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL(/\/dashboard/, { timeout: 20000 });

await page.goto(`${WEB}/dashboard/driving-school`, { waitUntil: 'networkidle' });
// The Students tab is not the default — click through to it.
await page.getByRole('button', { name: /students/i }).first().click().catch(() => {});
await page.waitForTimeout(1200);

const editBtn = page.getByRole('button', { name: /edit details/i }).first();
check('an "Edit details" action exists on a student row', await editBtn.isVisible().catch(() => false));

await editBtn.click();
await page.waitForTimeout(700);
check('the edit dialog opens with dialog semantics', await page.getByRole('dialog').isVisible().catch(() => false));

// Email must be visible but locked: bookings key on it.
const dialog = page.getByRole('dialog');
const emailField = dialog.locator('input[disabled], input[readonly]').first();
check(
  'the email is shown but not editable (it links the lesson history)',
  await emailField.isVisible().catch(() => false)
);

// Rename to a new value, save, and confirm it persisted through a reload.
const stamp = Date.now().toString().slice(-5);
const newName = `Edited Student ${stamp}`;
const nameInput = dialog.locator('input:not([disabled]):not([readonly])').first();
await nameInput.fill(newName);

const notesArea = dialog.locator('textarea').first();
const newNote = `Nervous on roundabouts (${stamp})`;
if (await notesArea.isVisible().catch(() => false)) await notesArea.fill(newNote);

await page.getByRole('button', { name: /^Save$/ }).click();
await page.waitForTimeout(1600);
check('a success toast appears', await page.getByText(/Student updated/i).first().isVisible().catch(() => false));

await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /students/i }).first().click().catch(() => {});
await page.waitForTimeout(1200);
check(
  'the new name persisted (a real write, not just local state)',
  (await page.content()).includes(newName),
  'name not found after reload'
);

// The note is private to the teacher, so verify it round-trips through the edit dialog.
await page.getByRole('button', { name: /edit details/i }).first().click();
await page.waitForTimeout(700);
check(
  'the note persisted too (notes used to be write-once)',
  (await page.getByRole('dialog').locator('textarea').first().inputValue().catch(() => '')) === newNote
);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// ── The Hebrew UI must not show raw i18n keys ────────────────────────────────────
console.log('\n  Hebrew (RTL) — new strings exist in all three locales');
await page.evaluate(() => localStorage.setItem('mumotor_lang', 'he'));
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /תלמידים|students/i }).first().click().catch(() => {});
await page.waitForTimeout(1200);
const heHtml = await page.content();
check(
  'no untranslated key leaks into the Hebrew UI',
  !/dashboard\.school\.students\.(editStudent|editTitle|editDesc|editEmailFixed|studentUpdated)/.test(heHtml),
  'a raw i18n key is rendering'
);
check('the page is right-to-left', await page.evaluate(() => document.documentElement.dir === 'rtl'));

check('no console errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
