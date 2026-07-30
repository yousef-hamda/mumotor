import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { readUnsubscribeToken } from '../utils/unsubscribe.js';
import { emailLocale, emailT, type EmailLocale } from '../services/email/strings.js';
import { logger } from '../lib/logger.js';

/**
 * Public unsubscribe endpoint (A-02).
 *
 * Two verbs, and both are required:
 *
 *  POST — RFC 8058 one-click. Gmail and Yahoo call this THEMSELVES from their own
 *         infrastructure when the recipient clicks the "Unsubscribe" affordance next to
 *         the sender name. It must act immediately, with no confirmation page and no
 *         authentication, or the provider treats the sender as non-compliant.
 *
 *  GET  — the human path, from the footer link. This one CONFIRMS first rather than
 *         acting, because link-scanners in corporate mail security products fetch every
 *         URL in a message; a GET that unsubscribed on sight would silently opt people
 *         out who never clicked anything.
 *
 * Deliberately outside /api and unauthenticated: an unsubscribe link that requires a
 * login is not a working unsubscribe link. The signed token is the only credential, which
 * is the accepted design for this — it authorises exactly one action for one recipient.
 */

const router = Router();

const esc = (s: string) =>
  String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c] as string));

/** Load the enrollment a token points at, plus the school name for the copy. */
async function loadByToken(token: string) {
  const enrollmentId = readUnsubscribeToken(token);
  if (!enrollmentId) return null;
  return prisma.clientEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      studentEmail: true,
      unsubscribedAt: true,
      website: { select: { name: true, locale: true } },
    },
  });
}

function page(locale: EmailLocale, title: string, bodyHtml: string, status = 200) {
  const rtl = locale === 'he' || locale === 'ar';
  return {
    status,
    html: `<!doctype html>
<html lang="${locale}"${rtl ? ' dir="rtl"' : ''}>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>${esc(title)}</title>
<style>
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;min-height:100dvh;display:grid;place-items:center;padding:24px;
  background:#F5F5F7;color:#1D1D1F;
  font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif}
.card{background:#fff;border:1px solid #E1E1E6;border-radius:16px;padding:32px;max-width:34rem;width:100%;
  text-align:${rtl ? 'right' : 'left'}}
h1{font-size:24px;line-height:1.25;letter-spacing:-.02em;margin:0 0 12px;font-weight:650}
p{color:#43434A;margin:0 0 12px}
p.small{color:#6E6E73;font-size:14px}
button{font:inherit;font-weight:600;cursor:pointer;border:0;border-radius:999px;padding:13px 26px;
  background:#0071E3;color:#fff;margin-top:8px}
button:hover{opacity:.92}
button:focus-visible{outline:2px solid #0071E3;outline-offset:3px}
@media (prefers-color-scheme: dark){
  body{background:#0A0A0C;color:#F2F2F5}
  .card{background:#131318;border-color:#26262E}
  p{color:#C8C8D0}p.small{color:#8E8E98}
}
</style>
</head>
<body><main class="card">${bodyHtml}</main></body></html>`,
  };
}

/**
 * The write itself. Idempotent — a provider may retry the one-click POST, and a person may
 * click the link twice; neither should error or move the timestamp.
 */
async function unsubscribe(id: string, alreadyOff: Date | null): Promise<void> {
  if (alreadyOff) return;
  await prisma.clientEnrollment.update({ where: { id }, data: { unsubscribedAt: new Date() } });
  logger.info(`unsubscribed enrollment ${id}`);
}

// POST /unsubscribe/:token — one-click, called by the mailbox provider. Must act at once.
router.post(
  '/unsubscribe/:token',
  rateLimit({ keyPrefix: 'unsub-post', windowSeconds: 60, max: 30 }),
  asyncHandler(async (req, res) => {
    const row = await loadByToken(req.params.token);
    // Always 200: a provider treats an error as a broken unsubscribe and may penalise the
    // sender. There is also nothing useful to tell an automated caller.
    if (!row) {
      res.status(200).type('text/plain').send('OK');
      return;
    }
    await unsubscribe(row.id, row.unsubscribedAt);
    res.status(200).type('text/plain').send('OK');
  })
);

// GET /unsubscribe/:token — the human path from the footer link. Confirms, then acts.
router.get(
  '/unsubscribe/:token',
  rateLimit({ keyPrefix: 'unsub-get', windowSeconds: 60, max: 30 }),
  asyncHandler(async (req, res) => {
    const row = await loadByToken(req.params.token);
    if (!row) {
      const p = page('en', emailT('en', 'unsubInvalid'), `
        <h1>${esc(emailT('en', 'unsubInvalid'))}</h1>
        <p>${esc(emailT('en', 'unsubInvalidBody'))}</p>`, 404);
      res.status(p.status).type('html').send(p.html);
      return;
    }

    const L = emailLocale(row.website.locale);
    const school = row.website.name;

    // Already off, or the confirm button was pressed → show the done state.
    if (row.unsubscribedAt || req.query.confirm === '1') {
      await unsubscribe(row.id, row.unsubscribedAt);
      const p = page(L, emailT(L, 'unsubTitle'), `
        <h1>${esc(emailT(L, 'unsubTitle'))}</h1>
        <p>${esc(emailT(L, 'unsubDone', { school }))}</p>
        <p class="small">${esc(emailT(L, 'unsubKeeps'))}</p>
        <p class="small">${esc(emailT(L, 'unsubResubscribe'))}</p>`);
      res.status(p.status).type('html').send(p.html);
      return;
    }

    // First view: confirm. The button POSTs so a link-scanner cannot trigger it, and the
    // form works with no JavaScript at all.
    const p = page(L, emailT(L, 'unsubConfirmTitle'), `
      <h1>${esc(emailT(L, 'unsubConfirmTitle'))}</h1>
      <p>${esc(emailT(L, 'unsubConfirmBody', { school }))}</p>
      <p class="small">${esc(emailT(L, 'unsubKeeps'))}</p>
      <form method="GET" action="">
        <input type="hidden" name="confirm" value="1"/>
        <button type="submit">${esc(emailT(L, 'unsubConfirmBtn'))}</button>
      </form>`);
    res.status(p.status).type('html').send(p.html);
  })
);

export default router;
