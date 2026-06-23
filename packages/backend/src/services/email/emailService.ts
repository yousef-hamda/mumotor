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
if (usingConsole) logger.info('Email: using console transport (set SMTP_* to send real email)');

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text ?? stripHtml(html),
    });
    if (usingConsole) {
      logger.info(`📧 [console-email] → ${to} :: ${subject}`);
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

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#18181b;border-radius:12px 12px 0 0;padding:22px 32px">
      <div style="font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.3px">DriveSawa</div>
    </div>
    <div style="background:#fff;border:1px solid #e4e4e7;border-top:0;border-radius:0 0 12px 12px;padding:32px">
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#a1a1aa;font-size:12px;margin-top:20px">
      DriveSawa — driving lessons made simple.
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

export function sendBookingConfirmation(
  to: string,
  data: { studentName: string; date: string; time: string; teacherName?: string; duration?: number }
) {
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Your lesson is confirmed</h1>
    <p style="color:#52525b">Hi ${esc(data.studentName)}, your driving lesson is booked.</p>
    ${infoBox(`
      <p style="margin:4px 0"><strong style="display:inline-block;width:90px;color:#71717a">Date</strong> ${esc(data.date)}</p>
      <p style="margin:4px 0"><strong style="display:inline-block;width:90px;color:#71717a">Time</strong> ${esc(data.time)}</p>
      ${data.duration ? `<p style="margin:4px 0"><strong style="display:inline-block;width:90px;color:#71717a">Duration</strong> ${data.duration} min</p>` : ''}
      ${data.teacherName ? `<p style="margin:4px 0"><strong style="display:inline-block;width:90px;color:#71717a">Instructor</strong> ${esc(data.teacherName)}</p>` : ''}
    `)}
    <p style="color:#52525b">Please arrive 5 minutes early. We'll send a reminder about 2 hours before.</p>`;
  return sendEmail({ to, subject: `Lesson confirmed — ${data.date} at ${data.time}`, html: layout('Lesson confirmed', body) });
}

export function sendBookingReminder(
  to: string,
  data: { studentName: string; date: string; time: string }
) {
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Lesson reminder</h1>
    <p style="color:#52525b">Hi ${esc(data.studentName)}, your driving lesson is coming up soon.</p>
    ${infoBox(`<p style="margin:0;font-size:16px"><strong>${esc(data.date)} at ${esc(data.time)}</strong></p>`)}
    <p style="color:#52525b">See you soon — drive safe getting here.</p>`;
  return sendEmail({ to, subject: `Reminder: lesson today at ${data.time}`, html: layout('Lesson reminder', body) });
}

export function sendDailyBookingOpen(
  to: string,
  data: { studentName: string; bookingUrl: string; forDate: string }
) {
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Booking is now open</h1>
    <p style="color:#52525b">Hi ${esc(data.studentName)}, you can now book your driving lesson for <strong>${esc(data.forDate)}</strong>. Slots fill up quickly.</p>
    <p>${button(data.bookingUrl, 'Book a lesson')}</p>
    <p style="color:#a1a1aa;font-size:13px">Or open this link: ${esc(data.bookingUrl)}</p>`;
  return sendEmail({ to, subject: 'Booking is open for your next driving lesson', html: layout('Booking open', body) });
}

export interface ReportSlot {
  time: string;
  booked: boolean;
  studentName?: string;
  studentPhone?: string;
}

export function sendEnhancedDailyReport(
  to: string,
  data: { teacherName: string; date: string; slots: ReportSlot[]; booked: number; empty: number; total: number }
) {
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
    <p style="color:#52525b">Hi ${esc(data.teacherName)}, here's what tomorrow looks like.</p>
    <div style="display:flex;gap:8px;margin:16px 0">
      <div style="flex:1;border:1px solid #e4e4e7;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:700;color:#18181b">${data.booked}</div><div style="font-size:12px;color:#71717a">Booked</div></div>
      <div style="flex:1;border:1px solid #e4e4e7;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:700;color:#18181b">${data.empty}</div><div style="font-size:12px;color:#71717a">Free</div></div>
      <div style="flex:1;border:1px solid #e4e4e7;border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:700;color:#18181b">${data.total}</div><div style="font-size:12px;color:#71717a">Total</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-top:8px">${rows || '<tr><td style="color:#a1a1aa;padding:8px 10px">No slots scheduled.</td></tr>'}</table>`;
  return sendEmail({ to, subject: `Your schedule for ${data.date} — ${data.booked} lesson(s)`, html: layout('Daily report', body) });
}

export function sendBulkCustomEmail(
  to: string,
  data: { subject: string; body: string; studentName: string }
) {
  const safeBody = esc(data.body).replace(/\n/g, '<br>');
  const body = `
    <p>Hi ${esc(data.studentName)},</p>
    <div style="margin:12px 0;line-height:1.6">${safeBody}</div>`;
  return sendEmail({ to, subject: data.subject, html: layout(data.subject, body) });
}

export function sendMagicLink(to: string, data: { magicUrl: string; studentName?: string }) {
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Your booking link</h1>
    <p style="color:#52525b">${data.studentName ? `Hi ${esc(data.studentName)},` : 'Hi,'} use the button below to book a lesson without re-entering your code. This link works once and expires in 15 minutes.</p>
    <p>${button(data.magicUrl, 'Open booking')}</p>`;
  return sendEmail({ to, subject: 'Your one-time booking link', html: layout('Booking link', body) });
}

export function sendWelcomeEnrollment(
  to: string,
  data: { studentName: string; bookingUrl: string; schoolName: string }
) {
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">Welcome to ${esc(data.schoolName)}</h1>
    <p style="color:#52525b">Hi ${esc(data.studentName)}, you're enrolled. Each morning you'll get an email when booking opens, and you can book a lesson anytime.</p>
    <p>${button(data.bookingUrl, 'Book your first lesson')}</p>`;
  return sendEmail({ to, subject: `You're enrolled at ${data.schoolName}`, html: layout('Welcome', body) });
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
