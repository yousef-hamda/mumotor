import cron from 'node-cron';
import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { env } from '../../config/env.js';
import { todayUtcMidnight } from '../../utils/time.js';
import { buildDaySchedule } from '../scheduling/schedulingService.js';
import {
  sendBookingReminder,
  sendDailyBookingOpen,
  sendEnhancedDailyReport,
} from '../email/emailService.js';

const REMINDER_WINDOW_MINUTES = 120; // ~2h before the lesson

/** Combine a UTC-midnight date + "HH:MM" into a Date (interpreted in UTC). */
function lessonDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(date);
  d.setUTCHours(h || 0, m || 0, 0, 0);
  return d;
}

/** Every 15 min: email students ~2h before their lesson, set reminderSent. */
export async function processBookingReminders(): Promise<number> {
  const today = todayUtcMidnight();
  const now = new Date();
  const candidates = await prisma.booking.findMany({
    where: { bookingDate: today, reminderSent: false, status: { in: ['CONFIRMED', 'PENDING'] } },
  });

  let sent = 0;
  for (const b of candidates) {
    const start = lessonDateTime(b.bookingDate, b.bookingTime);
    const minutesUntil = (start.getTime() - now.getTime()) / 60000;
    if (minutesUntil > 0 && minutesUntil <= REMINDER_WINDOW_MINUTES) {
      const ok = await sendBookingReminder(b.customerEmail, {
        studentName: b.customerName,
        date: b.bookingDate.toISOString().slice(0, 10),
        time: b.bookingTime,
      });
      if (ok) {
        await prisma.booking.update({ where: { id: b.id }, data: { reminderSent: true } });
        sent++;
      }
    }
  }
  if (sent) logger.info(`Reminders: sent ${sent}`);
  return sent;
}

/** 9 AM daily: notify every ACTIVE student that booking is open for tomorrow. */
export async function processDailyStudentNotifications(): Promise<number> {
  const websites = await prisma.website.findMany({
    where: { businessCategory: 'DRIVING_SCHOOL', status: 'PUBLISHED' },
    include: { enrollments: { where: { status: 'ACTIVE' } } },
  });

  const tomorrow = todayUtcMidnight();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const forDate = tomorrow.toISOString().slice(0, 10);

  let sent = 0;
  for (const site of websites) {
    const bookingUrl = `${env.FRONTEND_URL}/p/${site.slug}/book-lesson`;
    for (const student of site.enrollments) {
      const ok = await sendDailyBookingOpen(student.studentEmail, {
        studentName: student.studentName,
        bookingUrl,
        forDate,
      });
      if (ok) sent++;
    }
  }
  if (sent) logger.info(`Daily student notifications: sent ${sent}`);
  return sent;
}

/** 8 PM daily: email each teacher tomorrow's schedule. */
export async function processTeacherDailyReport(): Promise<number> {
  const websites = await prisma.website.findMany({
    where: { businessCategory: 'DRIVING_SCHOOL', status: 'PUBLISHED' },
    include: { settings: true, user: true },
  });

  const tomorrow = todayUtcMidnight();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  let sent = 0;
  for (const site of websites) {
    const schedule = await buildDaySchedule(site, site.settings, tomorrow);
    const ok = await sendEnhancedDailyReport(site.user.email, {
      teacherName: site.user.name,
      date: schedule.date,
      slots: schedule.slots.map((s) => ({
        time: s.time,
        booked: s.booked,
        studentName: s.studentName,
        studentPhone: s.studentPhone,
      })),
      booked: schedule.bookedCount,
      empty: schedule.emptyCount,
      total: schedule.total,
    });
    if (ok) sent++;
  }
  if (sent) logger.info(`Teacher daily reports: sent ${sent}`);
  return sent;
}

let started = false;
export function startCronJobs() {
  if (!env.ENABLE_CRON) {
    logger.info('Cron jobs disabled (ENABLE_CRON=false)');
    return;
  }
  if (started) return;
  started = true;

  // ~2h-before lesson reminders
  cron.schedule('*/15 * * * *', () => {
    processBookingReminders().catch((e) => logger.error('reminder job failed', e));
  });
  // 9 AM — "booking is open" to active students
  cron.schedule('0 9 * * *', () => {
    processDailyStudentNotifications().catch((e) => logger.error('student notif job failed', e));
  });
  // 8 PM — teacher daily report
  cron.schedule('0 20 * * *', () => {
    processTeacherDailyReport().catch((e) => logger.error('teacher report job failed', e));
  });

  logger.info('Cron jobs scheduled (reminders */15m, students 9:00, teacher report 20:00)');
}
