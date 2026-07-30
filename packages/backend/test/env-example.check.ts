/**
 * G-06 guard — both .env.example files must list every setting config/env.ts validates.
 *
 * They had drifted 21 keys behind the schema (the whole email setup, Google sign-in, photo
 * search, TRIAL_DAYS and APP_TIMEZONE). A fresh setup therefore booted fine and then did
 * nothing useful: no email, no Google sign-in, and — worst — the wrong timezone, which
 * silently shifts every "today"/"tomorrow" calculation in the booking system.
 *
 * Cheap, no database, no server. Runs in CI.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');

const schemaKeys = [
  ...readFileSync(path.join(repoRoot, 'packages/backend/src/config/env.ts'), 'utf8').matchAll(
    /^ {2}([A-Z][A-Z0-9_]*):/gm
  ),
].map((m) => m[1]);

const TARGETS = ['.env.example', 'packages/backend/.env.example'];

let fail = 0;
console.log(`\nG-06 — .env.example must cover all ${schemaKeys.length} validated settings\n`);

for (const rel of TARGETS) {
  const text = readFileSync(path.join(repoRoot, rel), 'utf8');
  const documented = new Set([...text.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]));
  const missing = schemaKeys.filter((k) => !documented.has(k));
  const extra = [...documented].filter((k) => !schemaKeys.includes(k));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`  \x1b[32m✓\x1b[0m ${rel} — all ${schemaKeys.length} keys, none stale`);
  } else {
    fail++;
    console.log(`  \x1b[31m✗\x1b[0m ${rel}`);
    if (missing.length) console.log(`      missing: ${missing.join(', ')}`);
    if (extra.length) console.log(`      no longer in env.ts: ${extra.join(', ')}`);
  }
}

console.log(fail ? '\nRegenerate the example files from config/env.ts.\n' : '\nIn sync.\n');
process.exit(fail ? 1 : 0);
