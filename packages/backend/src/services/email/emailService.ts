import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

let transporter: Transporter;
let usingConsole = false;

function buildTransport(): Transporter {
  if (env.SMTP_HOST && env.SMTP_PORT) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  // Fallback: render messages to the console (jsonTransport) so the app runs
  // with zero email config during development.
  usingConsole = true;
  return nodemailer.createTransport({ jsonTransport: true });
}

transporter = buildTransport();
if (env.RESEND_API_KEY) logger.info('Email: using Resend API transport');
else if (usingConsole) logger.info('Email: using console transport (set RESEND_API_KEY or SMTP_* to send real email)');

// ---------------------------------------------------------------------------
// Per-school branding
// ---------------------------------------------------------------------------
// Mail is sent from the Mumotor address, but every student-facing message is
// branded as the teacher's school (sender name, header logo/name, footer) so
// the student recognises it as coming from *their* instructor's site.

export interface EmailBrand {
  schoolName: string;
  logoUrl?: string; // absolute, email-safe URL (or undefined → show the name)
  fromName?: string; // sender display name; defaults to schoolName
}

/** Turn a stored logoSrc into an email-safe absolute URL, or undefined. */
export function resolveLogoUrl(logoSrc?: string | null): string | undefined {
  if (!logoSrc) return undefined;
  if (/^https?:\/\//i.test(logoSrc)) return logoSrc; // already absolute
  if (logoSrc.startsWith('/')) return `${env.APP_URL}${logoSrc}`; // uploaded path → absolutise
  return undefined; // data: URLs are stripped by most inboxes → fall back to the name
}

/** Build the email brand for a site from its name + stored configuration. */
export function siteBrand(site: { name: string; configuration?: unknown }): EmailBrand {
  const cfg = (site.configuration ?? {}) as { logoSrc?: string };
  return { schoolName: site.name, logoUrl: resolveLogoUrl(cfg.logoSrc), fromName: site.name };
}

/** From header: the school as the display name over the Mumotor address. */
function fromField(brand?: EmailBrand): string | { name: string; address: string } {
  const name = (brand?.fromName ?? brand?.schoolName)?.replace(/[<>"\r\n]/g, '').trim().slice(0, 78);
  if (!name) return env.EMAIL_FROM;
  const address = env.EMAIL_FROM.match(/<([^>]+)>/)?.[1] ?? env.EMAIL_FROM;
  return { name, address };
}

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  brand?: EmailBrand;
}

/** From header as an RFC 5322 string ("Name <addr>") for the Resend API. */
function fromString(brand?: EmailBrand): string {
  const f = fromField(brand);
  return typeof f === 'string' ? f : `${f.name} <${f.address}>`;
}

async function sendViaResend({ to, subject, html, text, brand }: SendArgs): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromString(brand),
      to: [to],
      subject,
      html,
      text: text ?? stripHtml(html),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
  const { id } = (await res.json()) as { id: string };
  logger.info(`📧 Email sent → ${to} :: ${subject} (resend ${id})`);
  return true;
}

export async function sendEmail({ to, subject, html, text, brand }: SendArgs): Promise<boolean> {
  try {
    if (env.RESEND_API_KEY) return await sendViaResend({ to, subject, html, text, brand });
    const info = await transporter.sendMail({
      from: fromField(brand),
      to,
      subject,
      html,
      text: text ?? stripHtml(html),
    });
    if (usingConsole) {
      // Dev aid: surface the action link so local flows (verify/reset/review) are clickable from logs.
      const link = html.match(/href="(https?:[^"]+)"/)?.[1] ?? '';
      logger.info(`📧 [console-email] → ${to} :: ${subject}${brand ? ` (from: ${brand.schoolName})` : ''}${link ? ` :: ${link}` : ''}`);
    } else {
      logger.info(`📧 Email sent → ${to} :: ${subject} (${info.messageId})`);
    }
    return true;
  } catch (err) {
    logger.error(`Email failed → ${to}`, (err as Error).message);
    return false;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Layout + templates
// ---------------------------------------------------------------------------

function layout(title: string, bodyHtml: string, brand?: EmailBrand): string {
  const name = brand?.schoolName || 'Mumotor';
  const header = brand?.logoUrl
    ? `<img src="${esc(brand.logoUrl)}" alt="${esc(name)}" height="40" style="height:40px;max-height:44px;max-width:220px;display:inline-block;border:0;outline:0">`
    : `<div style="font-size:19px;font-weight:700;color:#18181b;letter-spacing:-0.3px">${esc(name)}</div>`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title></head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden">
      <div style="padding:20px 32px;border-bottom:1px solid #f0f0f0;text-align:center">${header}</div>
      <div style="padding:32px">${bodyHtml}</div>
    </div>
    <p style="text-align:center;color:#a1a1aa;font-size:12px;margin-top:20px">
      ${brand?.schoolName ? `Sent by ${esc(name)} · powered by Mumotor` : 'Sent by Mumotor'}
    </p>
  </div>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;font-weight:600;padding:11px 22px;border-radius:8px;margin:8px 0">${label}</a>`;
}

function infoBox(rowsHtml: string): string {
  return `<div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:8px;padding:16px;margin:16px 0">${rowsHtml}</div>`;
}

/** "· School Name" suffix for subject lines (empty when no brand). */
function subjectTag(brand?: EmailBrand): string {
  return brand?.schoolName ? ` · ${brand.schoolName}` : '';
}

export function sendBookingConfirmation(
  to: string,
  data: {
    studentName: string;
    date: string;
    time: string;
    teacherName?: string;
    duration?: number;
    brand?: EmailBrand;
  }
) {
  const school = data.brand?.schoolName;
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Your lesson is confirmed</h1>
    <p style="color:#52525b">Hi ${esc(data.studentName)}, your driving lesson${school ? ` with <strong>${esc(school)}</strong>` : ''} is booked.</p>
    ${infoBox(`
      <p style="margin:4px 0"><strong style="display:inline-block;width:90px;color:#71717a">Date</strong> ${esc(data.date)}</p>
      <p style="margin:4px 0"><strong style="display:inline-block;width:90px;color:#71717a">Time</strong> ${esc(data.time)}</p>
      ${data.duration ? `<p style="margin:4px 0"><strong style="display:inline-block;width:90px;color:#71717a">Duration</strong> ${data.duration} min</p>` : ''}
      ${data.teacherName ? `<p style="margin:4px 0"><strong style="display:inline-block;width:90px;color:#71717a">Instructor</strong> ${esc(data.teacherName)}</p>` : ''}
    `)}
    <p style="color:#52525b">Please arrive 5 minutes early. We'll send a reminder about 2 hours before.</p>`;
  return sendEmail({
    to,
    subject: `Lesson confirmed — ${data.date} at ${data.time}${subjectTag(data.brand)}`,
    html: layout('Lesson confirmed', body, data.brand),
    brand: data.brand,
  });
}

export function sendBookingReminder(
  to: string,
  data: { studentName: string; date: string; time: string; brand?: EmailBrand }
) {
  const school = data.brand?.schoolName;
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Lesson reminder</h1>
    <p style="color:#52525b">Hi ${esc(data.studentName)}, your driving lesson${school ? ` with <strong>${esc(school)}</strong>` : ''} is coming up soon.</p>
    ${infoBox(`<p style="margin:0;font-size:16px"><strong>${esc(data.date)} at ${esc(data.time)}</strong></p>`)}
    <p style="color:#52525b">See you soon — drive safe getting here.</p>`;
  return sendEmail({
    to,
    subject: `Reminder: lesson today at ${data.time}${subjectTag(data.brand)}`,
    html: layout('Lesson reminder', body, data.brand),
    brand: data.brand,
  });
}

export function sendDailyBookingOpen(
  to: string,
  data: { studentName: string; bookingUrl: string; forDate: string; brand?: EmailBrand }
) {
  const school = data.brand?.schoolName;
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Booking is now open</h1>
    <p style="color:#52525b">Hi ${esc(data.studentName)}, you can now book your driving lesson${school ? ` with <strong>${esc(school)}</strong>` : ''} for <strong>${esc(data.forDate)}</strong>. Slots fill up quickly.</p>
    <p>${button(data.bookingUrl, 'Book a lesson')}</p>
    <p style="color:#a1a1aa;font-size:13px">Or open this link: ${esc(data.bookingUrl)}</p>`;
  return sendEmail({
    to,
    subject: school ? `Booking is open at ${school}` : 'Booking is open for your next driving lesson',
    html: layout('Booking open', body, data.brand),
    brand: data.brand,
  });
}

export interface ReportSlot {
  time: string;
  booked: boolean;
  studentName?: string;
  studentPhone?: string;
}

export function sendEnhancedDailyReport(
  to: string,
  data: {
    teacherName: string;
    date: string;
    slots: ReportSlot[];
    booked: number;
    empty: number;
    total: number;
    /** Which day this schedule is for — controls the email wording. Defaults to
     *  'tomorrow' so the existing daily-rhythm cron (which always reports on the
     *  next day) keeps behaving exactly as before. */
    when?: 'today' | 'tomorrow';
    brand?: EmailBrand;
  }
) {
  const when = data.when ?? 'tomorrow';
  const rows = data.slots
    .map(
      (s) => `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #f4f4f5;font-weight:600;font-family:monospace">${esc(s.time)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f4f4f5">
          ${
            s.booked
              ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;margin-right:6px"></span>${esc(s.studentName || 'Student')}${s.studentPhone ? ` · ${esc(s.studentPhone)}` : ''}`
              : '<span style="color:#a1a1aa">Free</span>'
          }
        </td>
      </tr>`
    )
    .join('');
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Your schedule for ${esc(data.date)}</h1>
    <p style="color:#52525b">Hi ${esc(data.teacherName)}, here's what ${when} looks like.</p>
    <table style="width:100%;border-collapse:separate;border-spacing:8px 0;margin:16px -8px" role="presentation"><tr>
      <td style="width:33%;border:1px solid #e4e4e7;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:700;color:#18181b">${data.booked}</div><div style="font-size:12px;color:#71717a">Booked</div></td>
      <td style="width:33%;border:1px solid #e4e4e7;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:700;color:#18181b">${data.empty}</div><div style="font-size:12px;color:#71717a">Free</div></td>
      <td style="width:33%;border:1px solid #e4e4e7;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:700;color:#18181b">${data.total}</div><div style="font-size:12px;color:#71717a">Total</div></td>
    </tr></table>
    <table style="width:100%;border-collapse:collapse;margin-top:8px">${rows || '<tr><td style="color:#a1a1aa;padding:8px 10px">No slots scheduled.</td></tr>'}</table>`;
  return sendEmail({
    to,
    subject: `Your schedule for ${data.date} — ${data.booked} lesson(s)`,
    html: layout('Daily report', body, data.brand),
    brand: data.brand,
  });
}

export function sendBulkCustomEmail(
  to: string,
  data: { subject: string; body: string; studentName: string; brand?: EmailBrand }
) {
  const safeBody = esc(data.body).replace(/\n/g, '<br>');
  const body = `
    <p>Hi ${esc(data.studentName)},</p>
    <div style="margin:12px 0;line-height:1.6">${safeBody}</div>`;
  return sendEmail({
    to,
    subject: data.subject,
    html: layout(data.subject, body, data.brand),
    brand: data.brand,
  });
}

export function sendMagicLink(
  to: string,
  data: { magicUrl: string; studentName?: string; brand?: EmailBrand }
) {
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Your booking link</h1>
    <p style="color:#52525b">${data.studentName ? `Hi ${esc(data.studentName)},` : 'Hi,'} use the button below to book a lesson without re-entering your code. This link works once and expires in 15 minutes.</p>
    <p>${button(data.magicUrl, 'Open booking')}</p>`;
  return sendEmail({
    to,
    subject: `Your one-time booking link${subjectTag(data.brand)}`,
    html: layout('Booking link', body, data.brand),
    brand: data.brand,
  });
}

export function sendBookingCancelled(
  to: string,
  data: {
    recipientName: string;
    date: string;
    time: string;
    /** Who cancelled — copy adapts for the other party. */
    cancelledBy: 'teacher' | 'student';
    studentName?: string;
    brand?: EmailBrand;
  }
) {
  const school = data.brand?.schoolName;
  const intro =
    data.cancelledBy === 'teacher'
      ? `Hi ${esc(data.recipientName)}, unfortunately your driving lesson${school ? ` with <strong>${esc(school)}</strong>` : ''} had to be cancelled.`
      : `Hi ${esc(data.recipientName)}, ${esc(data.studentName ?? 'a student')} cancelled their lesson — the slot is open again for other students.`;
  const outro =
    data.cancelledBy === 'teacher'
      ? 'Sorry for the inconvenience — you can book a new time whenever suits you.'
      : 'No action needed; your availability updated automatically.';
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Lesson cancelled</h1>
    <p style="color:#52525b">${intro}</p>
    ${infoBox(`<p style="margin:0;font-size:16px"><strong>${esc(data.date)} at ${esc(data.time)}</strong></p>`)}
    <p style="color:#52525b">${outro}</p>`;
  return sendEmail({
    to,
    subject: `Lesson cancelled — ${data.date} at ${data.time}${subjectTag(data.brand)}`,
    html: layout('Lesson cancelled', body, data.brand),
    brand: data.brand,
  });
}

export function sendReviewRequest(
  to: string,
  data: { studentName: string; reviewUrl: string; brand?: EmailBrand }
) {
  const school = data.brand?.schoolName;
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">How was your lesson?</h1>
    <p style="color:#52525b">Hi ${esc(data.studentName)}, thanks for driving with ${school ? `<strong>${esc(school)}</strong>` : 'us'} today. A short review helps other students choose their instructor — it takes less than a minute.</p>
    <p>${button(data.reviewUrl, 'Leave a review')}</p>
    <p style="color:#a1a1aa;font-size:13px">Or open this link: ${esc(data.reviewUrl)}</p>`;
  return sendEmail({
    to,
    subject: `How was your lesson?${subjectTag(data.brand)}`,
    html: layout('Leave a review', body, data.brand),
    brand: data.brand,
  });
}

export function sendPasswordReset(to: string, data: { name?: string; resetUrl: string }) {
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Reset your password</h1>
    <p style="color:#52525b">${data.name ? `Hi ${esc(data.name)},` : 'Hi,'} we received a request to reset your Mumotor password. This link works once and expires in 30 minutes.</p>
    <p>${button(data.resetUrl, 'Choose a new password')}</p>
    <p style="color:#a1a1aa;font-size:13px">If you didn't request this, you can safely ignore this email — your password stays unchanged.</p>`;
  return sendEmail({
    to,
    subject: 'Reset your Mumotor password',
    html: layout('Reset password', body),
  });
}

export function sendEmailVerification(to: string, data: { name?: string; verifyUrl: string }) {
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Verify your email</h1>
    <p style="color:#52525b">${data.name ? `Hi ${esc(data.name)},` : 'Hi,'} welcome to Mumotor. Please confirm this email address so you can recover your account and receive booking updates. The link expires in 24 hours.</p>
    <p>${button(data.verifyUrl, 'Verify my email')}</p>
    <p style="color:#a1a1aa;font-size:13px">If you didn't create a Mumotor account, you can safely ignore this email.</p>`;
  return sendEmail({
    to,
    subject: 'Verify your Mumotor email',
    html: layout('Verify email', body),
  });
}

export function sendWelcomeEnrollment(
  to: string,
  data: { studentName: string; bookingUrl: string; brand: EmailBrand }
) {
  const school = data.brand.schoolName;
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Welcome to ${esc(school)}</h1>
    <p style="color:#52525b">Hi ${esc(data.studentName)}, you're enrolled${school ? ` at <strong>${esc(school)}</strong>` : ''}. Each morning you'll get an email when booking opens, and you can book a lesson anytime.</p>
    <p>${button(data.bookingUrl, 'Book your first lesson')}</p>`;
  return sendEmail({
    to,
    subject: `You're enrolled at ${school}`,
    html: layout('Welcome', body, data.brand),
    brand: data.brand,
  });
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
