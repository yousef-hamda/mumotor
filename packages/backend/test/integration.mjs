// End-to-end integration test for the Otto Driving Teacher API.
// Run the server (NODE_ENV=test, so rate limiting is bypassed) then: node test/integration.mjs
const BASE = process.env.API_BASE || 'http://localhost:4000/api';

let pass = 0;
let fail = 0;
const failures = [];

function ok(name, cond, extra) {
  if (cond) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`  \x1b[31m✗ ${name}\x1b[0m ${extra ? JSON.stringify(extra) : ''}`);
  }
}
function section(t) {
  console.log(`\n\x1b[1m${t}\x1b[0m`);
}

async function req(method, path, { token, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, json };
}

const pad = (n) => String(n).padStart(2, '0');
function utcDate(offset) {
  const n = new Date();
  const d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + offset);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
const RUN = Date.now().toString(36);
const email = (n) => `test_${RUN}_${n}@example.com`;

async function main() {
  console.log(`\nOtto API integration tests → ${BASE}\n${'='.repeat(50)}`);

  // --- Health ---
  section('Health');
  {
    const r = await req('GET', '/health');
    ok('GET /health returns ok', r.status === 200 && r.json?.status === 'ok', r.json);
  }

  // --- Auth ---
  section('Auth');
  let token, token2, websiteId, slug;
  {
    const r = await req('POST', '/auth/login', { body: { email: 'teacher@otto.local', password: 'password123' } });
    ok('login seeded teacher', r.status === 200 && !!r.json?.token, r.json);
    token = r.json?.token;

    const bad = await req('POST', '/auth/login', { body: { email: 'teacher@otto.local', password: 'wrong' } });
    ok('login wrong password → 401', bad.status === 401, bad.status);

    const me = await req('GET', '/auth/me', { token });
    ok('GET /auth/me with token', me.status === 200 && me.json?.user?.email === 'teacher@otto.local', me.json);

    const noTok = await req('GET', '/auth/me');
    ok('GET /auth/me without token → 401', noTok.status === 401, noTok.status);

    const reg = await req('POST', '/auth/register', {
      body: { email: email('teacher2'), password: 'password123', name: 'Second Teacher' },
    });
    ok('register second teacher → 201', reg.status === 201 && !!reg.json?.token, reg.json);
    token2 = reg.json?.token;

    const dup = await req('POST', '/auth/register', {
      body: { email: 'teacher@otto.local', password: 'password123', name: 'Dup' },
    });
    ok('register duplicate email → 409', dup.status === 409, dup.status);

    const weak = await req('POST', '/auth/register', {
      body: { email: email('weak'), password: '123', name: 'Weak' },
    });
    ok('register weak password → 400', weak.status === 400, weak.status);
  }

  // --- Websites ---
  section('Websites');
  {
    const r = await req('GET', '/websites', { token });
    ok('list my websites', r.status === 200 && Array.isArray(r.json?.websites), r.json);
    const site = r.json?.websites?.find((w) => w.slug === 'davids-driving');
    ok('seeded website present', !!site, r.json?.websites?.map((w) => w.slug));
    websiteId = site?.id;
    slug = site?.slug;
    ok('website has _count', site && typeof site._count?.enrollments === 'number', site?._count);
  }

  // --- Ownership / auth gates ---
  section('Ownership & auth gates');
  {
    const owner = await req('GET', `/driving-school/${websiteId}/settings`, { token });
    ok('owner reads settings → 200', owner.status === 200, owner.status);

    const other = await req('GET', `/driving-school/${websiteId}/settings`, { token: token2 });
    ok('non-owner reads settings → 403', other.status === 403, other.status);

    const anon = await req('GET', `/driving-school/${websiteId}/settings`);
    ok('no token reads settings → 401', anon.status === 401, anon.status);
  }

  // --- Settings (normalize working hours so slot tests are deterministic) ---
  section('Settings');
  {
    const allOpen = {};
    for (const d of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      allOpen[d] = { isOpen: true, open: '08:00', close: '18:00' };
    const put = await req('PUT', `/driving-school/${websiteId}/settings`, {
      token,
      body: {
        enrollmentCode: 'DRIVE2026',
        classDuration: 60,
        advanceBookingDays: 14,
        bookingCutoffHour: 23,
        dailyCodeEnabled: true,
        breakTimes: [{ start: '12:00', end: '13:00' }],
        workingHours: allOpen,
      },
    });
    ok('PUT settings → 200', put.status === 200, put.json);
    ok('settings reflect classDuration=60', put.json?.classDuration === 60, put.json);
    ok('settings reflect advanceBookingDays=14', put.json?.advanceBookingDays === 14, put.json);
    ok('settings reflect breakTimes', put.json?.breakTimes?.[0]?.start === '12:00', put.json?.breakTimes);

    const bad = await req('PUT', `/driving-school/${websiteId}/settings`, { token, body: { classDuration: 5 } });
    ok('PUT settings invalid duration → 400', bad.status === 400, bad.status);

    const getS = await req('GET', `/driving-school/${websiteId}/settings`, { token });
    ok('GET settings has workingHours', !!getS.json?.workingHours?.monday, getS.json?.workingHours);
  }

  // --- Public settings ---
  section('Public settings (by slug)');
  {
    const r = await req('GET', `/driving-school/${slug}/public-settings`);
    ok('public-settings → 200', r.status === 200, r.status);
    ok('public-settings id matches websiteId', r.json?.id === websiteId, r.json?.id);
    ok('public-settings advanceBookingDays=14', r.json?.advanceBookingDays === 14, r.json);
    ok('public-settings exposes services', Array.isArray(r.json?.services), r.json?.services);

    const missing = await req('GET', `/driving-school/no-such-slug/public-settings`);
    ok('public-settings unknown slug → 404', missing.status === 404, missing.status);
  }

  // --- Daily code ---
  section('Daily code');
  let dailyCode;
  {
    const r = await req('GET', `/driving-school/${websiteId}/daily-code`, { token });
    ok('get-or-create daily code', r.status === 200 && /^[0-9A-F]{6}$/.test(r.json?.code || ''), r.json);
    dailyCode = r.json?.code;

    const again = await req('GET', `/driving-school/${websiteId}/daily-code`, { token });
    ok('daily code stable within the day', again.json?.code === dailyCode, again.json);

    const valid = await req('POST', `/driving-school/${websiteId}/daily-code/validate`, {
      body: { code: dailyCode, date: utcDate(0) },
    });
    ok('validate correct daily code → valid', valid.json?.valid === true, valid.json);

    const invalid = await req('POST', `/driving-school/${websiteId}/daily-code/validate`, {
      body: { code: 'ZZZZZZ', date: utcDate(0) },
    });
    ok('validate wrong daily code → invalid', invalid.json?.valid === false, invalid.json);
  }

  // --- Enrollment ---
  section('Enrollment');
  const student = email('student1');
  {
    const noEmail = await req('GET', `/driving-school/${websiteId}/check-enrollment`);
    ok('check-enrollment missing email → 400', noEmail.status === 400, noEmail.status);

    const anna = await req('GET', `/driving-school/${websiteId}/check-enrollment?email=anna@example.com`);
    ok('check-enrollment seeded active student', anna.json?.enrolled === true && anna.json?.active === true, anna.json);

    const unknown = await req('GET', `/driving-school/${websiteId}/check-enrollment?email=${email('nobody')}`);
    ok('check-enrollment unknown → enrolled:false', unknown.json?.enrolled === false, unknown.json);

    const wrong = await req('POST', '/driving-school/enroll', {
      body: { websiteId, studentName: 'Wrong Code', studentEmail: email('wrong'), enrollmentCode: 'NOPE' },
    });
    ok('enroll wrong code → 401', wrong.status === 401 && wrong.json?.code === 'INVALID_CODE', wrong.json);

    const good = await req('POST', '/driving-school/enroll', {
      body: { websiteId, studentName: 'Test Student', studentEmail: student, enrollmentCode: 'DRIVE2026' },
    });
    ok('enroll with static code → 201', good.status === 201, good.json);

    const dup = await req('POST', '/driving-school/enroll', {
      body: { websiteId, studentName: 'Test Student', studentEmail: student, enrollmentCode: 'DRIVE2026' },
    });
    ok('enroll duplicate email → 409', dup.status === 409 && dup.json?.code === 'ALREADY_ENROLLED', dup.json);

    const viaDaily = await req('POST', '/driving-school/enroll', {
      body: { websiteId, studentName: 'Daily Code Student', studentEmail: email('daily'), enrollmentCode: dailyCode },
    });
    ok('enroll with today daily code → 201', viaDaily.status === 201, viaDaily.json);
  }

  // --- Availability ---
  section('Availability');
  {
    const r = await req('GET', `/driving-school/${websiteId}/public-availability?date=${utcDate(5)}&email=${student}`);
    ok('availability for active student → 200', r.status === 200, r.status);
    ok('availability returns slots', Array.isArray(r.json?.slots) && r.json.slots.length > 0, r.json);
    ok('availability excludes break 12:00', !r.json?.slots?.includes('12:00'), r.json?.slots);
    ok('availability includes 09:00', r.json?.slots?.includes('09:00'), r.json?.slots);

    // seeded bookings tomorrow at 09:00 & 10:00 should be excluded
    const tom = await req('GET', `/driving-school/${websiteId}/public-availability?date=${utcDate(1)}&email=anna@example.com`);
    ok('tomorrow excludes booked 09:00/10:00', !tom.json?.slots?.includes('09:00') && !tom.json?.slots?.includes('10:00'), tom.json?.slots);

    const notEnrolled = await req('GET', `/driving-school/${websiteId}/public-availability?date=${utcDate(5)}&email=${email('ghost')}`);
    ok('availability for non-enrolled → 404', notEnrolled.status === 404, notEnrolled.status);
  }

  // --- Booking ---
  section('Booking');
  {
    const date = utcDate(6);
    // pick a currently-free slot so the suite is re-runnable within the same day
    const avail = await req('GET', `/driving-school/${websiteId}/public-availability?date=${date}&email=${student}`);
    const slot = avail.json?.slots?.[0] || '08:00';
    const book = await req('POST', `/driving-school/${websiteId}/book-lesson`, {
      body: { studentEmail: student, date, time: slot },
    });
    ok('book lesson → 201', book.status === 201 && book.json?.booking?.status === 'CONFIRMED', book.json);

    const dbl = await req('POST', `/driving-school/${websiteId}/book-lesson`, {
      body: { studentEmail: student, date, time: slot },
    });
    ok('double-book same slot → 409', dbl.status === 409 && dbl.json?.code === 'SLOT_NOT_AVAILABLE', dbl.json);

    const breakSlot = await req('POST', `/driving-school/${websiteId}/book-lesson`, {
      body: { studentEmail: student, date, time: '12:00' },
    });
    ok('book during break → 400 SLOT_NOT_AVAILABLE', breakSlot.status === 400 && breakSlot.json?.code === 'SLOT_NOT_AVAILABLE', breakSlot.json);

    const offGrid = await req('POST', `/driving-school/${websiteId}/book-lesson`, {
      body: { studentEmail: student, date, time: '09:30' },
    });
    ok('book off-grid time → 400', offGrid.status === 400, offGrid.json);

    const past = await req('POST', `/driving-school/${websiteId}/book-lesson`, {
      body: { studentEmail: student, date: utcDate(-1), time: '09:00' },
    });
    ok('book past date → 400 PAST_DATE', past.status === 400 && past.json?.code === 'PAST_DATE', past.json);

    const tooFar = await req('POST', `/driving-school/${websiteId}/book-lesson`, {
      body: { studentEmail: student, date: utcDate(20), time: '09:00' },
    });
    ok('book beyond advance window → 400 ADVANCE_BOOKING_EXCEEDED', tooFar.status === 400 && tooFar.json?.code === 'ADVANCE_BOOKING_EXCEEDED', tooFar.json);

    const noId = await req('POST', `/driving-school/${websiteId}/book-lesson`, { body: { date, time: '10:00' } });
    ok('book without email/token → 400', noId.status === 400, noId.json);

    // classCount incremented for the student after a successful booking
    const list = await req('GET', `/driving-school/${websiteId}/students?search=${encodeURIComponent(student)}`, { token });
    const me = list.json?.students?.find((s) => s.studentEmail === student);
    ok('classCount incremented after booking', me?.classCount >= 1, me);
  }

  // --- Same-day cutoff ---
  section('Same-day cutoff');
  {
    await req('PUT', `/driving-school/${websiteId}/settings`, { token, body: { bookingCutoffHour: 0 } });
    const today = await req('POST', `/driving-school/${websiteId}/book-lesson`, {
      body: { studentEmail: student, date: utcDate(0), time: '09:00' },
    });
    ok('today after cutoff → 400 BOOKING_CUTOFF_PASSED', today.status === 400 && today.json?.code === 'BOOKING_CUTOFF_PASSED', today.json);
    await req('PUT', `/driving-school/${websiteId}/settings`, { token, body: { bookingCutoffHour: 23 } });
  }

  // --- Students management ---
  section('Students management');
  {
    const list = await req('GET', `/driving-school/${websiteId}/students?status=ACTIVE&page=1&limit=5`, { token });
    ok('list students (filtered + paged)', list.status === 200 && Array.isArray(list.json?.students), list.json);
    ok('pagination metadata present', typeof list.json?.totalPages === 'number', list.json);

    const search = await req('GET', `/driving-school/${websiteId}/students?search=anna`, { token });
    ok('search finds Anna', search.json?.students?.some((s) => /anna/i.test(s.studentName)), search.json?.students?.length);

    // create a throwaway, then toggle/finish/delete
    const ta = email('throwaway');
    await req('POST', '/driving-school/enroll', { body: { websiteId, studentName: 'Throwaway', studentEmail: ta, enrollmentCode: 'DRIVE2026' } });
    const found = await req('GET', `/driving-school/${websiteId}/students?search=${encodeURIComponent(ta)}`, { token });
    const id = found.json?.students?.[0]?.id;
    ok('throwaway enrolled & listed', !!id, found.json);

    const t1 = await req('PATCH', `/driving-school/${websiteId}/students/${id}/toggle-status`, { token });
    ok('toggle ACTIVE → INACTIVE', t1.json?.enrollment?.status === 'INACTIVE', t1.json);
    const t2 = await req('PATCH', `/driving-school/${websiteId}/students/${id}/toggle-status`, { token });
    ok('toggle INACTIVE → ACTIVE', t2.json?.enrollment?.status === 'ACTIVE', t2.json);

    const fin = await req('PATCH', `/driving-school/${websiteId}/students/${id}/finish`, { token });
    ok('finish → COMPLETED + finishedAt', fin.json?.enrollment?.status === 'COMPLETED' && !!fin.json?.enrollment?.finishedAt, fin.json);

    const del = await req('DELETE', `/driving-school/${websiteId}/students/${id}`, { token });
    ok('delete student → deleted', del.json?.deleted === true, del.json);
    const gone = await req('GET', `/driving-school/${websiteId}/students?search=${encodeURIComponent(ta)}`, { token });
    ok('deleted student no longer listed', (gone.json?.students?.length ?? 0) === 0, gone.json);

    // ownership on student mutation
    const cross = await req('DELETE', `/driving-school/${websiteId}/students/anything`, { token: token2 });
    ok('non-owner cannot mutate students → 403', cross.status === 403, cross.status);
  }

  // --- Daily report ---
  section('Daily report');
  {
    const r = await req('GET', `/driving-school/${websiteId}/daily-report`, { token });
    ok('daily-report → 200', r.status === 200, r.status);
    ok('daily-report has slots + totals', Array.isArray(r.json?.slots) && r.json?.totals, r.json?.totals);
  }

  // --- Bulk email ---
  section('Bulk email');
  {
    const r = await req('POST', `/driving-school/${websiteId}/bulk-email`, {
      token,
      body: { subject: 'Test announcement', body: 'Hello students, this is a test.', targetGroup: 'active' },
    });
    ok('bulk-email → 200 COMPLETED', r.status === 200 && r.json?.status === 'COMPLETED', r.json);
    ok('bulk-email reports sentCount', typeof r.json?.sentCount === 'number' && r.json.sentCount >= 1, r.json);
  }

  // --- Self-deactivate ---
  section('Self-deactivate');
  {
    const wrong = await req('POST', '/driving-school/self-deactivate', {
      body: { email: student, websiteId, enrollmentCode: 'WRONGCODE' },
    });
    ok('self-deactivate wrong code → 401', wrong.status === 401, wrong.json);

    const good = await req('POST', '/driving-school/self-deactivate', {
      body: { email: student, websiteId, enrollmentCode: 'DRIVE2026' },
    });
    ok('self-deactivate correct code → INACTIVE', good.status === 200 && good.json?.status === 'INACTIVE', good.json);

    // now inactive → availability blocked
    const avail = await req('GET', `/driving-school/${websiteId}/public-availability?date=${utcDate(5)}&email=${student}`);
    ok('inactive student availability → 403', avail.status === 403, avail.status);
  }

  // --- Magic link ---
  section('Magic link');
  {
    const reqMagic = await req('POST', `/driving-school/${websiteId}/request-magic-link`, { body: { email: 'sam@example.com' } });
    ok('request-magic-link → sent:true', reqMagic.json?.sent === true, reqMagic.json);

    const badTok = await req('POST', '/driving-school/validate-magic-link', { body: { token: 'totally-invalid' } });
    ok('validate bad magic token → 400', badTok.status === 400, badTok.status);
  }

  // --- Summary ---
  console.log(`\n${'='.repeat(50)}`);
  console.log(`\x1b[1mResults: \x1b[32m${pass} passed\x1b[0m, ${fail ? `\x1b[31m${fail} failed\x1b[0m` : '0 failed'}`);
  if (fail) {
    console.log('Failed:', failures.join(', '));
    process.exit(1);
  }
  console.log('\x1b[32mAll integration tests passed.\x1b[0m');
}

main().catch((e) => {
  console.error('Test harness error:', e);
  process.exit(1);
});
