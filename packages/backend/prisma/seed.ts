import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { buildSiteHtml } from '../src/services/ai/templateBuilder.js';

const prisma = new PrismaClient();

function hashEnrollmentCode(code: string): string {
  const salt = randomBytes(8).toString('hex');
  const hash = createHash('sha256').update(`${salt}:${code}`).digest('hex');
  return `sha256:${salt}:${hash}`;
}

function utcMidnight(offsetDays = 0): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

async function main() {
  console.log('🌱 Seeding Mumotor...');

  const passwordHash = await bcrypt.hash('password123', 10);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@mumotor.local' },
    update: {},
    create: {
      email: 'teacher@mumotor.local',
      passwordHash,
      name: 'David Cohen',
      phone: '+972-50-123-4567',
      emailVerified: true,
      preferredLanguage: 'EN',
      subscription: { create: { plan: 'PRO', status: 'ACTIVE' } },
    },
  });
  console.log(`  ✓ Teacher: ${teacher.email} (password: password123)`);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mumotor.local' },
    update: { role: 'ADMIN' },
    create: { email: 'admin@mumotor.local', passwordHash, name: 'Platform Admin', role: 'ADMIN', emailVerified: true },
  });
  console.log(`  ✓ Admin: ${admin.email} (password: password123)`);

  const businessConfig = {
    enrollmentCode: 'DRIVE2026',
    classDuration: 60,
    advanceBookingDays: 14,
    bookingCutoffHour: 18,
    dailyCodeEnabled: true,
    breakTimes: [{ start: '12:00', end: '13:00' }],
    restMinutes: 0,
    teacherName: 'David Cohen',
    tagline: 'Your Road to Confidence',
    pricePerClass: 50,
    experienceYears: '10+',
    passRate: 95,
    studentsTaught: '500+',
    rating: '4.9',
    locale: 'en' as const,
    lessonTypes: [
      { name: 'Driving Lesson', description: 'A standard one-on-one lesson tailored to your level.', price: 50, duration: 45 },
      { name: 'First Lesson', description: 'A gentle introduction for brand-new drivers.', price: 40, duration: 45 },
      { name: 'Test Preparation', description: 'Mock test on real routes to get you exam-ready.', price: 55, duration: 60 },
      { name: 'Highway Lesson', description: 'Build confidence at speed on the open road.', price: 55, duration: 60 },
    ],
    contact: { phone: '+972-50-123-4567', email: 'teacher@mumotor.local', address: 'Netanya, Israel' },
  };

  const slug = 'davids-driving';
  const name = "David's Driving School";

  const website = await prisma.website.upsert({
    where: { slug },
    update: { status: 'PUBLISHED', publishedAt: new Date() },
    create: {
      userId: teacher.id,
      name,
      slug,
      tagline: 'Your Road to Confidence',
      businessCategory: 'DRIVING_SCHOOL',
      status: 'PUBLISHED',
      selectedPreset: 'clear-horizon',
      locale: 'EN',
      publishedAt: new Date(),
      configuration: { ...businessConfig },
      settings: {
        create: {
          businessHours: {
            monday: { isOpen: true, open: '08:00', close: '18:00' },
            tuesday: { isOpen: true, open: '08:00', close: '18:00' },
            wednesday: { isOpen: true, open: '08:00', close: '18:00' },
            thursday: { isOpen: true, open: '08:00', close: '18:00' },
            friday: { isOpen: true, open: '08:00', close: '14:00' },
            saturday: { isOpen: false, open: '09:00', close: '14:00' },
            sunday: { isOpen: true, open: '09:00', close: '16:00' },
          },
          socialLinks: { Instagram: 'https://instagram.com', Facebook: 'https://facebook.com' },
          contactInfo: businessConfig.contact,
        },
      },
      services: { create: { name: 'Driving Lesson', duration: 60, price: 0 } },
    },
  });
  // build the published HTML with the real website id (so the in-page booking widget works)
  const { html } = buildSiteHtml({ website: { id: website.id, name, slug }, config: businessConfig, presetId: 'clear-horizon' });
  await prisma.website.update({
    where: { id: website.id },
    data: { publishedHtml: html, configuration: { ...businessConfig, generatedHTML: html } },
  });
  console.log(`  ✓ Website: /site/${website.slug} (PUBLISHED, preset clear-horizon)`);

  const students = [
    { name: 'Anna Krause', email: 'anna@example.com', phone: '+972-52-111-1111', status: 'ACTIVE' as const, classCount: 4 },
    { name: 'Sam Becker', email: 'sam@example.com', phone: '+972-52-222-2222', status: 'ACTIVE' as const, classCount: 2 },
    { name: 'Omar Jaber', email: 'omar@example.com', phone: '+972-52-333-3333', status: 'INACTIVE' as const, classCount: 7 },
    { name: 'Nadia Levi', email: 'nadia@example.com', phone: '+972-52-444-4444', status: 'COMPLETED' as const, classCount: 20 },
  ];
  for (const s of students) {
    await prisma.clientEnrollment.upsert({
      where: { websiteId_studentEmail: { websiteId: website.id, studentEmail: s.email } },
      update: {},
      create: {
        websiteId: website.id,
        studentName: s.name,
        studentEmail: s.email,
        studentPhone: s.phone,
        enrollmentCode: hashEnrollmentCode('DRIVE2026'),
        status: s.status,
        classCount: s.classCount,
        finishedAt: s.status === 'COMPLETED' ? new Date() : null,
      },
    });
  }
  console.log(`  ✓ Students: ${students.length}`);

  // reviews
  const reviews = [
    { studentName: 'Anna K.', rating: 5, comment: 'Passed first time! Calm, patient and incredibly clear.', status: 'APPROVED' as const },
    { studentName: 'Sam B.', rating: 5, comment: 'Booking lessons online made everything so easy.', status: 'APPROVED' as const },
    { studentName: 'Omar J.', rating: 5, comment: 'Went from nervous to confident in a few weeks.', status: 'APPROVED' as const },
  ];
  const existingReviews = await prisma.review.count({ where: { websiteId: website.id } });
  if (existingReviews === 0) {
    await prisma.review.createMany({ data: reviews.map((r) => ({ ...r, websiteId: website.id })) });
  }
  console.log(`  ✓ Reviews: ${reviews.length}`);

  await prisma.dailyCode.upsert({
    where: { websiteId_date: { websiteId: website.id, date: utcMidnight(0) } },
    update: {},
    create: { websiteId: website.id, date: utcMidnight(0), code: randomBytes(3).toString('hex').toUpperCase(), isActive: true },
  });
  console.log('  ✓ Daily code for today');

  const service = await prisma.service.findFirst({ where: { websiteId: website.id, name: 'Driving Lesson' } });
  if (service) {
    const tomorrow = utcMidnight(1);
    for (const [email, sname, time] of [
      ['anna@example.com', 'Anna Krause', '09:00'],
      ['sam@example.com', 'Sam Becker', '10:00'],
    ] as const) {
      const exists = await prisma.booking.findFirst({ where: { websiteId: website.id, bookingDate: tomorrow, bookingTime: time } });
      if (!exists) {
        await prisma.booking.create({
          data: { websiteId: website.id, serviceId: service.id, customerName: sname, customerEmail: email, bookingDate: tomorrow, bookingTime: time, duration: 60, status: 'CONFIRMED' },
        });
      }
    }
    console.log('  ✓ Sample bookings for tomorrow');
  }

  console.log('✅ Seed complete.\n');
  console.log('   Teacher login : teacher@mumotor.local / password123');
  console.log('   Published site: /site/davids-driving');
  console.log('   Enroll        : /p/davids-driving/enroll  (code: DRIVE2026)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
