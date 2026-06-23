// Invokes the cron job functions once to confirm they run end-to-end.
import { prisma } from '../src/lib/prisma.js';
import {
  processBookingReminders,
  processDailyStudentNotifications,
  processTeacherDailyReport,
} from '../src/services/jobs/jobService.js';

async function main() {
  const reminders = await processBookingReminders();
  const studentNotifs = await processDailyStudentNotifications();
  const teacherReports = await processTeacherDailyReport();
  console.log('\n__CRON_RESULT__', JSON.stringify({ reminders, studentNotifs, teacherReports }));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('cron check failed:', e);
  process.exit(1);
});
