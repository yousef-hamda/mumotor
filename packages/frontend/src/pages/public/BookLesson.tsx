import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowRight, CalendarDays, CheckCircle2, Clock } from 'lucide-react';
import { apiError, drivingSchoolApi } from '../../lib/api';
import { formatDateLong, upcomingDates } from '../../lib/utils';
import { TEMPLATES } from '../../templates/registry';
import { dirForLocale } from '../../lib/templateTheme';
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

export default function BookLesson() {
  const { websiteSlug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['public-settings', websiteSlug],
    queryFn: () => drivingSchoolApi.getPublicSettings(websiteSlug),
    retry: false,
  });

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
        toast.success('Welcome back!');
      })
      .catch(() => toast.error('That booking link has expired. Please enter your email.'));
  }, [token, settings]);

  const checkEnrollment = useMutation({
    mutationFn: (e: string) => drivingSchoolApi.checkEnrollment(settings!.id, e),
    onSuccess: (res) => {
      if (res.enrolled && res.active === false) {
        toast.error('Your enrollment is paused. Please contact your instructor.');
        return;
      }
      setNeedsEnrollment(!res.enrolled);
      if (res.studentName) setStudentName(res.studentName);
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
    onSuccess: () => setStep('done'),
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
    schoolName: settings?.name,
    logoSrc: settings?.logoSrc,
    publicSlug: websiteSlug,
    width: (step === 'time' ? 'wide' : 'narrow') as 'wide' | 'narrow',
  };

  if (isLoading)
    return (
      <TemplatedShell slug={slug} publicSlug={websiteSlug}>
        <BookSpinner label="Loading…" />
      </TemplatedShell>
    );
  if (isError || !settings)
    return (
      <TemplatedShell slug={slug} publicSlug={websiteSlug}>
        <BookCard>
          <h1 className="book-title">School not found</h1>
          <p className="book-sub">This booking link may be incorrect or no longer active.</p>
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
          <p className="book-eyebrow">Book a lesson</p>
          <h1 className="book-title" style={{ marginTop: '0.6rem' }}>
            Book your next lesson
          </h1>
          <p className="book-sub">Lessons are booked for the next day. Enter the email you enrolled with to start.</p>
          {windowConfigured && (
            <p className="book-sub" style={{ marginTop: '0.35rem' }}>
              Booking is open daily {wStart}–{wEnd} (Israel time).
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast.error('Please enter a valid email');
              checkEnrollment.mutate(email.trim());
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.4rem' }}
          >
            <BookField label="Email">
              <BookInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </BookField>
            <BookButton variant="primary" type="submit" loading={checkEnrollment.isPending} className="book-btn-block">
              Continue <ArrowRight style={{ height: '1rem', width: '1rem' }} />
            </BookButton>
          </form>
          <p className="book-sub" style={{ textAlign: 'center', marginTop: '1.2rem' }}>
            Not enrolled yet?{' '}
            <Link to={`/p/${websiteSlug}/enroll`} className="book-link">
              Enroll here
            </Link>
          </p>
        </BookCard>
      )}

      {/* STEP: details (inline enroll) */}
      {step === 'details' && (
        <BookCard>
          <button type="button" className="book-back" onClick={() => setStep('email')}>
            ← Back
          </button>
          <h1 className="book-title">Quick enrollment</h1>
          <p className="book-sub">We don't recognize this email yet. Enter your name and code to continue.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const code = (new FormData(e.currentTarget).get('code') as string) ?? '';
              if (studentName.trim().length < 2) return toast.error('Please enter your name');
              if (!/^[+\d][\d\s-]{6,18}$/.test(studentPhone.trim())) return toast.error('Please enter a valid phone number');
              if (code.trim().length < 4) return toast.error('Enter the code from your instructor');
              enroll.mutate(code);
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.4rem' }}
          >
            <BookField label="Full name">
              <BookInput value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Jane Doe" required />
            </BookField>
            <BookField label="Phone">
              <BookInput type="tel" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} placeholder="+972 50 123 4567" required />
            </BookField>
            <BookField label="Enrollment code">
              <BookInput name="code" placeholder="e.g. DRIVE2026" style={{ fontFamily: 'var(--book-font-display)', letterSpacing: '0.15em' }} required />
            </BookField>
            <BookButton variant="primary" type="submit" loading={enroll.isPending} className="book-btn-block">
              Continue <ArrowRight style={{ height: '1rem', width: '1rem' }} />
            </BookButton>
          </form>
        </BookCard>
      )}

      {/* STEP: time (tomorrow only) */}
      {step === 'time' && (
        <BookCard>
          <button type="button" className="book-back" onClick={() => { setPendingTime(''); setStep('email'); }}>
            ← Back
          </button>
          <h1 className="book-title">Choose a time</h1>
          <p className="book-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CalendarDays style={{ height: '1rem', width: '1rem' }} /> Tomorrow · {formatDateLong(tomorrow)}
          </p>

          {!windowOpen ? (
            <div className="book-note" style={{ marginTop: '1.4rem' }}>
              Booking is closed right now. It opens daily at <strong>{wStart}</strong> (Israel time). Please come back then to
              book tomorrow's lesson.
            </div>
          ) : availability.isLoading ? (
            <BookSpinner label="Checking availability…" />
          ) : availability.data?.closed ? (
            <div className="book-note" style={{ marginTop: '1.4rem' }}>
              No classes tomorrow — the school is closed on {formatDateLong(tomorrow).split(',')[0]}. Please check back on a working day.
            </div>
          ) : !availability.data || availability.data.slots.length === 0 ? (
            <div className="book-note" style={{ marginTop: '1.4rem' }}>
              No available times for tomorrow — every slot is booked. Please try again later.
            </div>
          ) : pendingTime ? (
            <div style={{ marginTop: '1.4rem' }}>
              <div className="book-note" style={{ borderStyle: 'solid' }}>
                <p style={{ margin: 0 }}>You're booking a lesson for</p>
                <p style={{ margin: '0.4rem 0 0', fontWeight: 700, color: 'var(--book-ink)' }}>{formatDateLong(tomorrow)}</p>
                <p style={{ margin: '0.2rem 0 0', fontFamily: 'var(--book-font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--book-ink)' }}>
                  {pendingTime}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
                <BookButton variant="secondary" className="book-btn-block" onClick={() => setPendingTime('')}>
                  Change time
                </BookButton>
                <BookButton variant="primary" className="book-btn-block" loading={book.isPending} onClick={() => book.mutate()}>
                  Confirm booking
                </BookButton>
              </div>
            </div>
          ) : (
            <div className="book-chip-grid" style={{ marginTop: '1.4rem' }}>
              {availability.data.slots.map((t) => (
                <button key={t} type="button" className="book-chip" onClick={() => setPendingTime(t)}>
                  {t}
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
            Lesson booked
          </h1>
          <p className="book-sub" style={{ textAlign: 'center' }}>
            See you <strong style={{ color: 'var(--book-ink)' }}>{formatDateLong(tomorrow)}</strong> at{' '}
            <strong style={{ color: 'var(--book-ink)' }}>{pendingTime}</strong>.
          </p>
          <div className="book-note" style={{ marginTop: '1.2rem', textAlign: 'start' }}>
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock style={{ height: '1rem', width: '1rem', flexShrink: 0 }} /> We'll remind you ~2 hours before.
            </p>
            <p style={{ margin: '0.5rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays style={{ height: '1rem', width: '1rem', flexShrink: 0 }} /> Please arrive 5 minutes early.
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
            Book another lesson
          </BookButton>
          <Link to={accountHref} className="book-btn book-btn-secondary book-btn-block" style={{ marginTop: '0.6rem' }}>
            Go to my account
          </Link>
          <Link to={homeHref} className="book-btn book-btn-ghost book-btn-block" style={{ marginTop: '0.4rem' }}>
            Back to home
          </Link>
        </BookCard>
      )}

      {/* Footer: reach the student account (replaces the old My lessons / Pause modals) */}
      {step !== 'done' && (
        <p style={{ marginTop: '1.4rem', textAlign: 'center', fontSize: '0.8rem' }}>
          <Link to={accountHref} className="book-link">
            My account &amp; lessons
          </Link>
        </p>
      )}
    </TemplatedShell>
  );
}
