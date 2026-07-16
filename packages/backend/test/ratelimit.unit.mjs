// Unit test for the rate-limit keying fix. The per-route rate limits are bypassed
// in NODE_ENV=test, so this exercises the security-critical `clientIp` logic directly:
// it MUST use Express's trust-proxy-aware `req.ip` and MUST NOT trust a spoofable
// `X-Forwarded-For` header (whose first token an attacker controls to rotate the
// rate-limit key). Run: node test/ratelimit.unit.mjs  (imports the built dist)
import { clientIp } from '../dist/middleware/rateLimit.js';

let pass = 0;
let fail = 0;
function ok(name, cond, extra) {
  if (cond) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    fail++;
    console.log(`  \x1b[31m✗ ${name}\x1b[0m ${extra !== undefined ? JSON.stringify(extra) : ''}`);
  }
}

console.log('\nRate-limit keying unit test\n' + '='.repeat(50));

// req.ip is Express's resolved client IP (last trusted hop with trust proxy = 1).
const spoofed = {
  ip: '203.0.113.7',
  headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2, evil-spoof' },
  socket: { remoteAddress: '198.51.100.9' },
};
const r1 = clientIp(spoofed);
ok('uses req.ip, ignores spoofed X-Forwarded-For', r1 === '203.0.113.7', r1);
ok('does NOT return the spoofed XFF first token', r1 !== '10.0.0.1', r1);

// Falls back to the socket address when req.ip is absent.
const noIp = { ip: undefined, headers: { 'x-forwarded-for': 'attacker' }, socket: { remoteAddress: '198.51.100.9' } };
const r2 = clientIp(noIp);
ok('falls back to socket.remoteAddress', r2 === '198.51.100.9', r2);
ok('fallback still ignores XFF', r2 !== 'attacker', r2);

// Last-resort constant when nothing is available (keeps one bucket, never crashes).
const r3 = clientIp({ ip: undefined, headers: {}, socket: {} });
ok("returns 'unknown' when no address is available", r3 === 'unknown', r3);

console.log('\n' + '='.repeat(50));
console.log(`\x1b[1mResults: \x1b[32m${pass} passed\x1b[0m, ${fail ? `\x1b[31m${fail} failed\x1b[0m` : '0 failed'}`);
process.exit(fail ? 1 : 0);
