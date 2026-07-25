import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTenantSlug } from '../../lib/tenant';
import { SitePausedScreen, isSuspended, type PausedInfo } from '../../components/public/SitePaused';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock } from 'lucide-react';
import { apiError, drivingSchoolApi, studentPortalApi, studentTokenStore } from '../../lib/api';
import { formatDateLongIn, formatWeekdayIn, upcomingDates } from '../../lib/utils';
import { TEMPLATES } from '../../templates/registry';
import { dirForLocale } from '../../lib/templateTheme';
import { bookLocale, bookT } from '../../lib/bookingStrings';
import {
  TemplatedShell,
  BookButton,
  BookCard,
  BookField,
  BookInput,
  BookSpinner,
} from '../../components/public/TemplatedShell';

type Step = 'email' | 'details' | 'time' | 'done';

/** Current wall-clock minutes in the app timezone (Israel), for the booking window. */
function nowIsraelMinutes(): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}
const hhmmToMin = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
/** "08:00" + 45 → "08:45". */
const addMinutes = (hhmm: string, mins: number) => {
  const t = hhmmToMin(hhmm) + mins;
  const h = Math.floor(t / 60) % 24;
  const m = t % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};
/** "08:00 – 08:45" for a slot of the given duration. */
const slotRange = (start: string, dur: number) => `${start} – ${addMinutes(start, dur)}`;

export default function BookLesson() {
  const websiteSlug = useTenantSlug();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['public-settings', websiteSlug],
    queryFn: () => drivingSchoolApi.getPublicSettings(websiteSlug),
    retry: false,
  });

  const L = bookLocale(settings?.locale);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [needsEnrollment, setNeedsEnrollment] = useState(false);
  const [pendingTime, setPendingTime] = useState('');

  // The only bookable day is tomorrow (UTC-aligned, matching the backend).
  const tomorrow = useMemo(() => upcomingDates(2)[1], []);

  // Magic-link auto-fill
  useEffect(() => {
    if (!token || !settings) return;
    drivingSchoolApi
      .validateMagicLink(token)
      .then((res) => {
        setEmail(res.email);
        setStudentName(res.studentName);
        setNeedsEnrollment(false);
        setStep('time');
        toast.success(bookT(L, 'welcomeBack'));
      })
      .catch(() => toast.error(bookT(L, 'linkExpired')));
  }, [token, settings]);

  // Logged-in session: skip the email step. If the student is signed in on this site
  // (and there's no magic-link token in play), jump straight to choosing a time.
  // Booking only needs `email` (a public action), so we use the email saved with the
  // session for an INSTANT, reliable skip — no waiting on a network call. Older
  // sessions that predate saved info fall back to looking the student up.
  useEffect(() => {
    // `!settings.id` guards a frozen (SUSPENDED) site whose payload carries no id — the
    // render returns the paused screen, but this mount effect runs first, so without the
    // guard it would fire me(undefined) → /driving-school/undefined/student/me.
    if (token || !settings || !settings.id) return;
    if (!studentTokenStore.activate(websiteSlug)) return;
    const info = studentTokenStore.info(websiteSlug);
    if (info?.email) {
      setEmail(info.email);
      setStudentName(info.name || '');
      setNeedsEnrollment(false);
      setStep('time');
      return;
    }
    studentPortalApi
      .me(settings.id)
      .then((student) => {
        setEmail(student.email);
        setStudentName(student.name);
        setNeedsEnrollment(false);
        setStep('time');
      })
      .catch(() => {
        /* expired/invalid token — fall back to the email step */
      });
  }, [token, settings, websiteSlug]);

  const checkEnrollment = useMutation({
    mutationFn: (e: string) => drivingSchoolApi.checkEnrollment(settings!.id, e),
    onSuccess: (res) => {
      if (res.enrolled && res.active === false) {
        toast.error(bookT(L, 'enrollmentPaused'));
        return;
      }
      setNeedsEnrollment(!res.enrolled);
      setStep(res.enrolled ? 'time' : 'details');
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  const enroll = useMutation({
    mutationFn: (code: string) =>
      drivingSchoolApi.enroll({
        websiteId: settings!.id,
        studentName: studentName.trim(),
        studentEmail: email.trim(),
        studentPhone: studentPhone.trim(),
        enrollmentCode: code.trim(),
      }),
    onSuccess: () => {
      setNeedsEnrollment(false);
      setStep('time');
      // Sign them in for next time (best-effort) so they won't re-enter their email.
      studentPortalApi
        .login(settings!.id, { email: email.trim() })
        .then(({ token: t, student }) => studentTokenStore.set(websiteSlug, t, { email: student.email, name: student.name }))
        .catch(() => { /* ignore — booking still proceeds */ });
    },
    onError: (e) => {
      const { status, message } = apiError(e);
      if (status === 409) {
        setNeedsEnrollment(false);
        setStep('time');
      } else toast.error(message);
    },
  });

  const availability = useQuery({
    queryKey: ['availability', settings?.id, tomorrow, email],
    queryFn: () => drivingSchoolApi.getPublicAvailability(settings!.id, tomorrow, email),
    enabled: step === 'time' && !!settings && !!email && !needsEnrollment,
  });

  const book = useMutation({
    mutationFn: () => drivingSchoolApi.bookLesson(settings!.id, { studentEmail: email, date: tomorrow, time: pendingTime }),
    onSuccess: () => {
      // Refetch availability so "Book another lesson" can't offer the slot we just took (M22).
      availability.refetch();
      setStep('done');
    },
    onError: (e) => {
      const { status, message } = apiError(e);
      toast.error(message);
      if (status === 409) {
        setPendingTime('');
        availability.refetch();
      }
    },
  });

  const slug =
    settings?.template && TEMPLATES.some((t) => t.slug === settings.template) ? settings.template : TEMPLATES[0].slug;
  const shellProps = {
    slug,
    theme: (settings?.customization as { theme?: Record<string, string> } | undefined)?.theme,
    dir: dirForLocale(settings?.locale),
    locale: settings?.locale,
    schoolName: settings?.name,
    logoSrc: settings?.logoSrc,
    publicSlug: websiteSlug,
    width: (step === 'time' ? 'wide' : 'narrow') as 'wide' | 'narrow',
  };

  if (isLoading)
    return (
      <TemplatedShell slug={slug} publicSlug={websiteSlug}>
        <BookSpinner label={bookT(L, 'loading')} />
      </TemplatedShell>
    );
  // Frozen (SUSPENDED) site → on-brand paused screen instead of a form that posts to
  // /driving-school/undefined/… (the suspended payload has no id) with an English error.
  if (isSuspended(settings)) return <SitePausedScreen settings={settings as PausedInfo} />;
  if (isError || !settings)
    return (
      <TemplatedShell slug={slug} publicSlug={websiteSlug}>
        <BookCard>
          <h1 className="book-title">{bookT(L, 'schoolNotFound')}</h1>
          <p className="book-sub">{bookT(L, 'notFoundBook')}</p>
        </BookCard>
      </TemplatedShell>
    );

  const homeHref = `/p/${websiteSlug}`;
  const accountHref = `/p/${websiteSlug}/account`;

  // Booking window (Israel time). Default 00:00–23:59 = always open.
  const wStart = settings.bookingWindowStart;
  const wEnd = settings.bookingWindowEnd;
  const windowConfigured = !!wStart && !!wEnd && !(wStart === '00:00' && wEnd === '23:59');
  const nowMin = nowIsraelMinutes();
  const windowOpen = !windowConfigured || (nowMin >= hhmmToMin(wStart!) && nowMin <= hhmmToMin(wEnd!));

  return (
    <TemplatedShell {...shellProps}>
      {/* STEP: email */}
      {step === 'email' && (
        <BookCard>
          <p className="book-eyebrow">{bookT(L, 'bookLesson')}</p>
          <h1 className="book-title" style={{ marginTop: '0.6rem' }}>
            {bookT(L, 'bookTitle')}
          </h1>
          <p className="book-sub">{bookT(L, 'bookHelper')}</p>
          {windowConfigured && (
            <p className="book-sub" style={{ marginTop: '0.35rem' }}>
              {bookT(L, 'windowOpenDaily', { wStart: wStart!, wEnd: wEnd! })}
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast.error(bookT(L, 'errEmail'));
              checkEnrollment.mutate(email.trim());
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.4rem' }}
          >
            <BookField label={bookT(L, 'emailLabel')}>
              <BookInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={bookT(L, 'phEmailYou')} required />
            </BookField>
            <BookButton variant="primary" type="submit" loading={checkEnrollment.isPending} className="book-btn-block">
              {bookT(L, 'continue')} <ArrowRight className="book-arrow" style={{ height: '1rem', width: '1rem' }} />
            </BookButton>
          </form>
          <p className="book-sub" style={{ textAlign: 'center', marginTop: '1.2rem' }}>
            {bookT(L, 'notEnrolledYet')}{' '}
            <Link to={`/p/${websiteSlug}/enroll`} className="book-link">
              {bookT(L, 'enrollHere')}
            </Link>
          </p>
        </BookCard>
      )}

      {/* STEP: details (inline enroll) */}
      {step === 'details' && (
        <BookCard>
          <button type="button" className="book-back" onClick={() => setStep('email')}>
            <ArrowLeft className="book-arrow" style={{ height: '1rem', width: '1rem' }} /> {bookT(L, 'back')}
          </button>
          <h1 className="book-title">{bookT(L, 'quickEnrollTitle')}</h1>
          <p className="book-sub">{bookT(L, 'quickEnrollHelper')}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const code = (new FormData(e.currentTarget).get('code') as string) ?? '';
              if (studentName.trim().length < 2) return toast.error(bookT(L, 'errName'));
              if (!/^[+\d][\d\s-]{6,18}$/.test(studentPhone.trim())) return toast.error(bookT(L, 'errPhone'));
              if (code.trim().length < 4) return toast.error(bookT(L, 'errCodeInstructor'));
              enroll.mutate(code);
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.4rem' }}
          >
            <BookField label={bookT(L, 'fullName')}>
              <BookInput value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder={bookT(L, 'phName')} required />
            </BookField>
            <BookField label={bookT(L, 'phoneLabel')}>
              <BookInput type="tel" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} placeholder={bookT(L, 'phPhone')} required />
            </BookField>
            <BookField label={bookT(L, 'enrollmentCode')}>
              <BookInput name="code" placeholder={bookT(L, 'phCode')} style={{ fontFamily: 'var(--book-font-display)', letterSpacing: '0.15em' }} required />
            </BookField>
            <BookButton variant="primary" type="submit" loading={enroll.isPending} className="book-btn-block">
              {bookT(L, 'continue')} <ArrowRight className="book-arrow" style={{ height: '1rem', width: '1rem' }} />
            </BookButton>
          </form>
        </BookCard>
      )}

      {/* STEP: time (tomorrow only) */}
      {step === 'time' && (
        <BookCard>
          <button type="button" className="book-back" onClick={() => { setPendingTime(''); setStep('email'); }}>
            <ArrowLeft className="book-arrow" style={{ height: '1rem', width: '1rem' }} /> {bookT(L, 'back')}
          </button>
          <h1 className="book-title">{bookT(L, 'chooseTime')}</h1>
          <p className="book-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CalendarDays style={{ height: '1rem', width: '1rem' }} /> {bookT(L, 'tomorrowDate', { date: formatDateLongIn(tomorrow, L) })}
          </p>
          <p className="book-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
            <Clock style={{ height: '1rem', width: '1rem' }} /> {bookT(L, 'eachLessonArrive', { duration: settings.classDuration })}
          </p>

          {!windowOpen ? (
            <div className="book-note" style={{ marginTop: '1.4rem' }}>
              {(() => {
                const [before, after] = bookT(L, 'bookingClosed').split('{wStart}');
                return (
                  <>
                    {before}
                    <strong>{wStart}</strong>
                    {after}
                  </>
                );
              })()}
            </div>
          ) : availability.isLoading ? (
            <BookSpinner label={bookT(L, 'checkingAvailability')} />
          ) : availability.data?.closed ? (
            <div className="book-note" style={{ marginTop: '1.4rem' }}>
              {bookT(L, 'noClassesTomorrow', { day: formatWeekdayIn(tomorrow, L) })}
            </div>
          ) : !availability.data || availability.data.slots.length === 0 ? (
            <div className="book-note" style={{ marginTop: '1.4rem' }}>
              {bookT(L, 'allBooked')}
            </div>
          ) : pendingTime ? (
            <div style={{ marginTop: '1.4rem' }}>
              <div className="book-note" style={{ borderStyle: 'solid' }}>
                <p style={{ margin: 0 }}>{bookT(L, 'youreBooking')}</p>
                <p style={{ margin: '0.4rem 0 0', fontWeight: 700, color: 'var(--book-ink)' }}>{formatDateLongIn(tomorrow, L)}</p>
                <p style={{ margin: '0.2rem 0 0', fontFamily: 'var(--book-font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--book-ink)' }}>
                  {slotRange(pendingTime, settings.classDuration)}
                </p>
              </div>
              <div className="book-confirm-actions">
                <BookButton variant="secondary" className="book-btn-block" onClick={() => setPendingTime('')}>
                  {bookT(L, 'changeTime')}
                </BookButton>
                <BookButton variant="primary" className="book-btn-block" loading={book.isPending} onClick={() => book.mutate()}>
                  {bookT(L, 'confirmBooking')}
                </BookButton>
              </div>
            </div>
          ) : (
            <div className="book-chip-grid" style={{ marginTop: '1.4rem' }}>
              {availability.data.slots.map((t) => (
                <button key={t} type="button" className="book-chip" onClick={() => setPendingTime(t)}>
                  {slotRange(t, settings.classDuration)}
                </button>
              ))}
            </div>
          )}
        </BookCard>
      )}

      {/* STEP: done */}
      {step === 'done' && (
        <BookCard>
          <div className="book-check">
            <CheckCircle2 style={{ height: '2.2rem', width: '2.2rem' }} strokeWidth={1.75} />
          </div>
          <h1 className="book-title" style={{ marginTop: '1rem', textAlign: 'center' }}>
            {bookT(L, 'lessonBooked')}
          </h1>
          <p className="book-sub" style={{ textAlign: 'center' }}>
            {(() => {
              const [a, restb] = bookT(L, 'seeYou').split('{date}');
              const [b, c] = restb.split('{time}');
              return (
                <>
                  {a}
                  <strong style={{ color: 'var(--book-ink)' }}>{formatDateLongIn(tomorrow, L)}</strong>
                  {b}
                  <strong style={{ color: 'var(--book-ink)' }}>{slotRange(pendingTime, settings.classDuration)}</strong>
                  {c}
                </>
              );
            })()}
          </p>
          <div className="book-note" style={{ marginTop: '1.2rem', textAlign: 'start' }}>
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock style={{ height: '1rem', width: '1rem', flexShrink: 0 }} /> {bookT(L, 'reminderLine')}
            </p>
            <p style={{ margin: '0.5rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays style={{ height: '1rem', width: '1rem', flexShrink: 0 }} /> {bookT(L, 'arriveEarly')}
            </p>
          </div>
          <BookButton
            variant="primary"
            className="book-btn-block"
            style={{ marginTop: '1.4rem' }}
            onClick={() => {
              setPendingTime('');
              setStep('time');
            }}
          >
            {bookT(L, 'bookAnother')}
          </BookButton>
          <Link to={accountHref} className="book-btn book-btn-secondary book-btn-block" style={{ marginTop: '0.6rem' }}>
            {bookT(L, 'goToAccount')}
          </Link>
          <Link to={homeHref} className="book-btn book-btn-ghost book-btn-block" style={{ marginTop: '0.4rem' }}>
            {bookT(L, 'backToHome')}
          </Link>
        </BookCard>
      )}

      {/* Footer: reach the student account (replaces the old My lessons / Pause modals) */}
      {step !== 'done' && (
        <p style={{ marginTop: '1.4rem', textAlign: 'center', fontSize: '0.8rem' }}>
          <Link to={accountHref} className="book-link">
            {bookT(L, 'myAccountLessons')}
          </Link>
        </p>
      )}
    </TemplatedShell>
  );
}
