import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { emailLocale, emailT, type EmailLocale } from './strings.js';

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
  locale?: EmailLocale; // the SITE's language — drives the email copy + RTL layout
}

/** Turn a stored logoSrc into an email-safe absolute URL, or undefined. */
export function resolveLogoUrl(logoSrc?: string | null): string | undefined {
  if (!logoSrc) return undefined;
  if (/^https?:\/\//i.test(logoSrc)) return logoSrc; // already absolute
  if (logoSrc.startsWith('/')) return `${env.APP_URL}${logoSrc}`; // uploaded path → absolutise
  return undefined; // data: URLs are stripped by most inboxes → fall back to the name
}

/** Build the email brand for a site from its name + stored configuration. */
export function siteBrand(site: { name: string; configuration?: unknown; locale?: string }): EmailBrand {
  const cfg = (site.configuration ?? {}) as { logoSrc?: string };
  return {
    schoolName: site.name,
    logoUrl: resolveLogoUrl(cfg.logoSrc),
    fromName: site.name,
    locale: emailLocale(site.locale),
  };
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
  /** Optional BCC — e.g. the Trustpilot AFS auto-invite on INSTRUCTOR emails only. */
  bcc?: string | string[];
}

/** From header as an RFC 5322 string ("Name <addr>") for the Resend API. */
function fromString(brand?: EmailBrand): string {
  const f = fromField(brand);
  return typeof f === 'string' ? f : `${f.name} <${f.address}>`;
}

async function sendViaResend({ to, subject, html, text, brand, bcc }: SendArgs): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromString(brand),
      to: [to],
      ...(bcc ? { bcc: Array.isArray(bcc) ? bcc : [bcc] } : {}),
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

export async function sendEmail({ to, subject, html, text, brand, bcc }: SendArgs): Promise<boolean> {
  try {
    if (env.RESEND_API_KEY) return await sendViaResend({ to, subject, html, text, brand, bcc });
    const info = await transporter.sendMail({
      from: fromField(brand),
      to,
      ...(bcc ? { bcc } : {}),
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
  const L: EmailLocale = brand?.locale ?? 'en';
  const rtl = L === 'he' || L === 'ar';
  const name = brand?.schoolName || 'Mumotor';
  const header = brand?.logoUrl
    ? `<img src="${esc(brand.logoUrl)}" alt="${esc(name)}" height="40" style="height:40px;max-height:44px;max-width:220px;display:inline-block;border:0;outline:0">`
    : `<div style="font-size:19px;font-weight:700;color:#18181b;letter-spacing:-0.3px">${esc(name)}</div>`;
  return `<!doctype html>
<html${rtl ? ' dir="rtl"' : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title></head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b${rtl ? ';text-align:right' : ''}">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden">
      <div style="padding:20px 32px;border-bottom:1px solid #f0f0f0;text-align:center">${header}</div>
      <div style="padding:32px">${bodyHtml}</div>
    </div>
    <p style="text-align:center;color:#a1a1aa;font-size:12px;margin-top:20px">
      ${brand?.schoolName ? emailT(L, 'footerSchool', { name: esc(name) }) : emailT(L, 'footerMumotor')}
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

/** Strip header-injection chars from a name before it goes into a Subject line (L13). */
function safeName(s: string): string {
  return String(s).replace(/[<>"\r\n]/g, '').trim();
}

/** "· School Name" suffix for subject lines (empty when no brand). */
function subjectTag(brand?: EmailBrand): string {
  return brand?.schoolName ? ` · ${safeName(brand.schoolName)}` : '';
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
  const L: EmailLocale = data.brand?.locale ?? 'en';
  const school = data.brand?.schoolName;
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">${emailT(L, 'confHeading')}</h1>
    <p style="color:#52525b">${
      school
        ? emailT(L, 'confBodyWithSchool', { name: esc(data.studentName), school: esc(school) })
        : emailT(L, 'confBodyNoSchool', { name: esc(data.studentName) })
    }</p>
    ${infoBox(`
      <p style="margin:4px 0"><strong style="display:inline-block;width:90px;color:#71717a">${emailT(L, 'labelDate')}</strong> ${esc(data.date)}</p>
      <p style="margin:4px 0"><strong style="display:inline-block;width:90px;color:#71717a">${emailT(L, 'labelTime')}</strong> ${esc(data.time)}</p>
      ${data.duration ? `<p style="margin:4px 0"><strong style="display:inline-block;width:90px;color:#71717a">${emailT(L, 'labelDuration')}</strong> ${emailT(L, 'durationMin', { n: data.duration })}</p>` : ''}
      ${data.teacherName ? `<p style="margin:4px 0"><strong style="display:inline-block;width:90px;color:#71717a">${emailT(L, 'labelInstructor')}</strong> ${esc(data.teacherName)}</p>` : ''}
    `)}
    <p style="color:#52525b">${emailT(L, 'confArrive')}</p>`;
  return sendEmail({
    to,
    subject: `${emailT(L, 'subjConfirmed', { date: data.date, time: data.time })}${subjectTag(data.brand)}`,
    html: layout(emailT(L, 'titleConfirmed'), body, data.brand),
    brand: data.brand,
  });
}

export function sendBookingReminder(
  to: string,
  data: { studentName: string; date: string; time: string; brand?: EmailBrand }
) {
  const L: EmailLocale = data.brand?.locale ?? 'en';
  const school = data.brand?.schoolName;
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">${emailT(L, 'remHeading')}</h1>
    <p style="color:#52525b">${
      school
        ? emailT(L, 'remBodyWithSchool', { name: esc(data.studentName), school: esc(school) })
        : emailT(L, 'remBodyNoSchool', { name: esc(data.studentName) })
    }</p>
    ${infoBox(`<p style="margin:0;font-size:16px"><strong>${emailT(L, 'dateAtTime', { date: esc(data.date), time: esc(data.time) })}</strong></p>`)}
    <p style="color:#52525b">${emailT(L, 'remOutro')}</p>`;
  return sendEmail({
    to,
    subject: `${emailT(L, 'subjReminder', { time: data.time })}${subjectTag(data.brand)}`,
    html: layout(emailT(L, 'titleReminder'), body, data.brand),
    brand: data.brand,
  });
}

export function sendDailyBookingOpen(
  to: string,
  data: { studentName: string; bookingUrl: string; forDate: string; brand?: EmailBrand }
) {
  const L: EmailLocale = data.brand?.locale ?? 'en';
  const school = data.brand?.schoolName;
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">${emailT(L, 'openHeading')}</h1>
    <p style="color:#52525b">${
      school
        ? emailT(L, 'openBodyWithSchool', { name: esc(data.studentName), school: esc(school), date: esc(data.forDate) })
        : emailT(L, 'openBodyNoSchool', { name: esc(data.studentName), date: esc(data.forDate) })
    }</p>
    <p>${button(data.bookingUrl, emailT(L, 'openBtn'))}</p>
    <p style="color:#a1a1aa;font-size:13px">${emailT(L, 'orOpenLink', { url: esc(data.bookingUrl) })}</p>`;
  return sendEmail({
    to,
    subject: school ? emailT(L, 'subjOpenSchool', { school: safeName(school) }) : emailT(L, 'subjOpenNoSchool'),
    html: layout(emailT(L, 'titleBookingOpen'), body, data.brand),
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
  const L: EmailLocale = data.brand?.locale ?? 'en';
  const when = data.when ?? 'tomorrow';
  const ACCENT = '#0071E3';
  const INK = '#1D1D1F';
  const MUTED = '#86868B';
  const LINE = '#F0F0F2';

  const stat = (n: number, label: string, accent?: string) =>
    `<td style="width:33.33%;padding:0 4px" valign="top">
      <div style="border:1px solid #EDEDF0;border-radius:14px;padding:14px 8px;text-align:center;background:#fff">
        <div style="font-size:26px;font-weight:700;color:${accent || INK};letter-spacing:-0.5px;line-height:1">${n}</div>
        <div style="font-size:12px;color:${MUTED};margin-top:5px">${label}</div>
      </div>
    </td>`;

  const rows = data.slots
    .map((s) => {
      const timeBadge = `<span style="display:inline-block;font-family:'SF Mono',ui-monospace,Menlo,monospace;font-size:13px;font-weight:700;color:${s.booked ? ACCENT : MUTED};background:${s.booked ? 'rgba(0,113,227,0.08)' : '#F5F5F7'};border-radius:9px;padding:7px 10px;white-space:nowrap">${esc(s.time)}</span>`;
      const tel = s.studentPhone ? s.studentPhone.replace(/[^\d+]/g, '') : '';
      const detail = s.booked
        ? `<div style="font-weight:600;color:${INK};font-size:15px;line-height:1.3">${esc(s.studentName || emailT(L, 'studentFallback'))}</div>` +
          (s.studentPhone
            ? `<a href="tel:${esc(tel)}" style="color:${ACCENT};text-decoration:none;font-size:14px;font-weight:500;font-family:'SF Mono',ui-monospace,Menlo,monospace">${esc(s.studentPhone)}</a>`
            : `<span style="color:${MUTED};font-size:13px">${emailT(L, 'noPhone')}</span>`)
        : `<span style="color:${MUTED};font-size:14px">${emailT(L, 'slotFree')}</span>`;
      return `<tr>
        <td style="padding:13px 0;border-bottom:1px solid ${LINE};vertical-align:top;width:92px">${timeBadge}</td>
        <td style="padding:13px 0 13px 14px;border-bottom:1px solid ${LINE};vertical-align:top">${detail}</td>
      </tr>`;
    })
    .join('');

  const heading = when === 'today' ? emailT(L, 'headingToday') : emailT(L, 'headingTomorrow');
  const body = `
    <h1 style="font-size:22px;margin:0 0 5px;font-weight:700;color:${INK};letter-spacing:-0.4px">${heading}</h1>
    <p style="color:${MUTED};margin:0 0 20px;font-size:15px">${emailT(L, 'reportIntro', { name: esc(data.teacherName), date: esc(data.date) })}</p>
    <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0;margin:0 -4px 6px"><tr>
      ${stat(data.booked, emailT(L, 'tileBooked'), ACCENT)}${stat(data.empty, emailT(L, 'tileFree'))}${stat(data.total, emailT(L, 'tileTotal'))}
    </tr></table>
    <table style="width:100%;border-collapse:collapse;margin-top:14px">${rows || `<tr><td style="color:${MUTED};padding:14px 0">${emailT(L, 'noLessons')}</td></tr>`}</table>
    ${data.booked > 0 ? `<p style="color:${MUTED};font-size:13px;margin-top:18px">${emailT(L, 'tapNumber')}</p>` : ''}`;
  return sendEmail({
    to,
    subject: `${emailT(L, 'subjReport', { heading, date: data.date, n: data.booked })}${subjectTag(data.brand)}`,
    html: layout(emailT(L, 'titleDailyReport'), body, data.brand),
    brand: data.brand,
  });
}

export function sendBulkCustomEmail(
  to: string,
  data: { subject: string; body: string; studentName: string; brand?: EmailBrand }
) {
  const L: EmailLocale = data.brand?.locale ?? 'en';
  const safeBody = esc(data.body).replace(/\n/g, '<br>');
  const body = `
    <p>${emailT(L, 'bulkHi', { name: esc(data.studentName) })}</p>
    <div style="margin:12px 0;line-height:1.6">${safeBody}</div>`;
  return sendEmail({
    to,
    subject: `${data.subject}${subjectTag(data.brand)}`,
    html: layout(data.subject, body, data.brand),
    brand: data.brand,
  });
}

export function sendMagicLink(
  to: string,
  data: { magicUrl: string; studentName?: string; brand?: EmailBrand }
) {
  const L: EmailLocale = data.brand?.locale ?? 'en';
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">${emailT(L, 'magicHeading')}</h1>
    <p style="color:#52525b">${
      data.studentName
        ? emailT(L, 'magicBodyNamed', { name: esc(data.studentName) })
        : emailT(L, 'magicBodyAnon')
    }</p>
    <p>${button(data.magicUrl, emailT(L, 'magicBtn'))}</p>`;
  return sendEmail({
    to,
    subject: `${emailT(L, 'subjMagic')}${subjectTag(data.brand)}`,
    html: layout(emailT(L, 'titleBookingLink'), body, data.brand),
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
  const L: EmailLocale = data.brand?.locale ?? 'en';
  const school = data.brand?.schoolName;
  const intro =
    data.cancelledBy === 'teacher'
      ? school
        ? emailT(L, 'cancTeacherWithSchool', { name: esc(data.recipientName), school: esc(school) })
        : emailT(L, 'cancTeacherNoSchool', { name: esc(data.recipientName) })
      : emailT(L, 'cancStudent', {
          name: esc(data.recipientName),
          student: esc(data.studentName ?? emailT(L, 'cancAStudent')),
        });
  const outro =
    data.cancelledBy === 'teacher'
      ? emailT(L, 'cancOutroTeacher')
      : emailT(L, 'cancOutroStudent');
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">${emailT(L, 'cancHeading')}</h1>
    <p style="color:#52525b">${intro}</p>
    ${infoBox(`<p style="margin:0;font-size:16px"><strong>${emailT(L, 'dateAtTime', { date: esc(data.date), time: esc(data.time) })}</strong></p>`)}
    <p style="color:#52525b">${outro}</p>`;
  return sendEmail({
    to,
    subject: `${emailT(L, 'subjCancelled', { date: data.date, time: data.time })}${subjectTag(data.brand)}`,
    html: layout(emailT(L, 'titleCancelled'), body, data.brand),
    brand: data.brand,
  });
}

export function sendReviewRequest(
  to: string,
  data: { studentName: string; reviewUrl: string; brand?: EmailBrand }
) {
  const L: EmailLocale = data.brand?.locale ?? 'en';
  const school = data.brand?.schoolName;
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">${emailT(L, 'revHeading')}</h1>
    <p style="color:#52525b">${
      school
        ? emailT(L, 'revBodyWithSchool', { name: esc(data.studentName), school: esc(school) })
        : emailT(L, 'revBodyNoSchool', { name: esc(data.studentName) })
    }</p>
    <p>${button(data.reviewUrl, emailT(L, 'revBtn'))}</p>
    <p style="color:#a1a1aa;font-size:13px">${emailT(L, 'orOpenLink', { url: esc(data.reviewUrl) })}</p>`;
  return sendEmail({
    to,
    subject: `${emailT(L, 'subjReview')}${subjectTag(data.brand)}`,
    html: layout(emailT(L, 'titleReview'), body, data.brand),
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

/**
 * Trustpilot AFS (Automatic Feedback Service): a unique BCC address that makes
 * Trustpilot auto-send a review invitation to the recipient a few days later.
 * BCC it ONLY on INSTRUCTOR emails (Mumotor's own customers) — never on student
 * booking/enrollment emails (students review their instructor, not the platform).
 * Overridable via TRUSTPILOT_AFS_BCC env; falls back to the verified address.
 */
const TRUSTPILOT_AFS_BCC = process.env.TRUSTPILOT_AFS_BCC || 'mumotor.com+f1498a9e3f@invite.trustpilot.com';

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
    // Instructor sign-up email → Trustpilot auto-invites them to review Mumotor.
    bcc: TRUSTPILOT_AFS_BCC,
  });
}

export function sendWelcomeEnrollment(
  to: string,
  data: { studentName: string; bookingUrl: string; brand: EmailBrand }
) {
  const L: EmailLocale = data.brand?.locale ?? 'en';
  const school = data.brand.schoolName;
  const body = `
    <h1 style="font-size:20px;margin:0 0 12px;font-weight:700">${emailT(L, 'welHeading', { school: esc(school) })}</h1>
    <p style="color:#52525b">${
      school
        ? emailT(L, 'welBodyWithSchool', { name: esc(data.studentName), school: esc(school) })
        : emailT(L, 'welBodyNoSchool', { name: esc(data.studentName) })
    }</p>
    <p>${button(data.bookingUrl, emailT(L, 'welBtn'))}</p>`;
  return sendEmail({
    to,
    subject: emailT(L, 'subjWelcome', { school: safeName(school) }),
    html: layout(emailT(L, 'titleWelcome'), body, data.brand),
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
