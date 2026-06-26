import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock } from 'lucide-react';
import { apiError, drivingSchoolApi } from '../../lib/api';
import { Button, Card, CenteredSpinner, Field, Input, Modal } from '../../components/ui';
import { PublicShell } from '../../components/PublicShell';
import { formatDateLong, formatDateShort, upcomingDates } from '../../lib/utils';
import type { BusinessHours, PublicSettings } from '../../lib/types';
import { FadeUp } from '../../components/motion';

type Step = 'email' | 'date' | 'details' | 'time' | 'done';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
function isDayOpen(dateStr: string, hours: BusinessHours): boolean {
  const key = DAYS[new Date(dateStr + 'T00:00:00').getDay()];
  const d = hours?.[key];
  return d ? !!d.isOpen : true;
}

function Stepper({ step }: { step: Step }) {
  const order: Step[] = ['email', 'date', 'time'];
  const labels: Record<string, string> = { email: 'Identify', date: 'Choose date', time: 'Choose time' };
  const activeIdx = step === 'details' ? 1 : order.indexOf(step === 'done' ? 'time' : step);
  return (
    <div className="mb-6 flex justify-center">
      <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
        {order.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={
                i <= activeIdx
                  ? 'flex h-7 w-7 items-center justify-center rounded-full bg-sun-600 text-xs font-bold text-white'
                  : 'flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/60 text-xs font-semibold text-sand-500'
              }
            >
              {i + 1}
            </span>
            <span className={i <= activeIdx ? 'font-semibold text-sand-900' : 'text-sand-500'}>{labels[s]}</span>
            {i < order.length - 1 && <span className="mx-1 h-px w-8 bg-sand-300/70" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BookLesson() {
  const { websiteSlug = '' } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { data: settings, isLoading, isError } = useQuery<PublicSettings>({
    queryKey: ['public-settings', websiteSlug],
    queryFn: () => drivingSchoolApi.getPublicSettings(websiteSlug),
    retry: false,
  });

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [needsEnrollment, setNeedsEnrollment] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);

  // Magic-link auto-fill
  useEffect(() => {
    if (!token) return;
    drivingSchoolApi
      .validateMagicLink(token)
      .then((res) => {
        setEmail(res.email);
        setStudentName(res.studentName);
        setNeedsEnrollment(false);
        setStep('date');
        toast.success('Welcome back!');
      })
      .catch(() => toast.error('That booking link has expired. Please enter your email.'));
  }, [token]);

  const checkEnrollment = useMutation({
    mutationFn: (e: string) => drivingSchoolApi.checkEnrollment(settings!.id, e),
    onSuccess: (res) => {
      if (res.enrolled && res.active === false) {
        toast.error('Your enrollment is paused. Please contact your instructor.');
        return;
      }
      setNeedsEnrollment(!res.enrolled);
      if (res.studentName) setStudentName(res.studentName);
      setStep('date');
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  const enroll = useMutation({
    mutationFn: (code: string) =>
      drivingSchoolApi.enroll({
        websiteId: settings!.id,
        studentName: studentName.trim(),
        studentEmail: email.trim(),
        enrollmentCode: code.trim(),
      }),
    onSuccess: () => {
      setNeedsEnrollment(false);
      setStep('time');
    },
    onError: (e) => {
      const { status, message } = apiError(e);
      if (status === 409) {
        // already enrolled — let them through
        setNeedsEnrollment(false);
        setStep('time');
      } else toast.error(message);
    },
  });

  const availability = useQuery({
    queryKey: ['availability', settings?.id, selectedDate, email],
    queryFn: () => drivingSchoolApi.getPublicAvailability(settings!.id, selectedDate, email),
    enabled: step === 'time' && !!settings && !!selectedDate && !!email && !needsEnrollment,
  });

  const book = useMutation({
    mutationFn: () => drivingSchoolApi.bookLesson(settings!.id, { studentEmail: email, date: selectedDate, time: selectedTime }),
    onSuccess: () => {
      setConfirmOpen(false);
      setStep('done');
    },
    onError: (e) => {
      const { status, message } = apiError(e);
      toast.error(message);
      if (status === 409) {
        setConfirmOpen(false);
        availability.refetch();
      }
    },
  });

  const pause = useMutation({
    mutationFn: (code: string) => drivingSchoolApi.selfDeactivate({ email: email.trim(), websiteId: settings!.id, enrollmentCode: code.trim() }),
    onSuccess: (res) => {
      toast.success(res.message);
      setPauseOpen(false);
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  const advanceDays = settings?.advanceBookingDays ?? 14;
  const dates = useMemo(() => upcomingDates(Math.min(advanceDays + 1, 30)), [advanceDays]);

  if (isLoading)
    return (
      <PublicShell>
        <CenteredSpinner label="Loading…" />
      </PublicShell>
    );

  if (isError || !settings)
    return (
      <PublicShell>
        <Card className="text-center">
          <h1 className="text-lg font-semibold text-sand-900">School not found</h1>
          <p className="mt-1 text-sm text-sand-600">This booking link may be incorrect or no longer active.</p>
        </Card>
      </PublicShell>
    );

  const hours = (settings.businessHours ?? {}) as BusinessHours;

  return (
    <PublicShell schoolName={settings.name} slug={websiteSlug} width={step === 'date' || step === 'time' ? 'wide' : 'narrow'}>
      {step !== 'done' && <Stepper step={step} />}

      {/* STEP: email */}
      {step === 'email' && (
        <FadeUp>
          <Card>
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-sand-200 bg-sand-50">
              <CalendarDays className="h-5 w-5 text-sun-600" strokeWidth={1.75} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-sand-900">
              Book a driving lesson
            </h1>
            <p className="mt-1 text-sm text-sand-600">Enter the email you enrolled with to get started.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast.error('Please enter a valid email');
                checkEnrollment.mutate(email.trim());
              }}
              className="mt-6 space-y-4"
            >
              <Field label="Email">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </Field>
              <Button variant="primary" type="submit" loading={checkEnrollment.isPending} className="w-full">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-sand-600">
              Not enrolled yet?{' '}
              <Link to={`/p/${websiteSlug}/enroll`} className="link-underline">
                Enroll here
              </Link>
            </p>
          </Card>
        </FadeUp>
      )}

      {/* STEP: date */}
      {step === 'date' && (
        <Card>
          <button
            onClick={() => setStep('email')}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 transition-colors hover:text-sand-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-sand-900">Choose a date</h1>
          <p className="mt-1 text-sm text-sand-600">
            Book up to {advanceDays} day{advanceDays > 1 ? 's' : ''} ahead.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {dates.map((d) => {
              const open = isDayOpen(d, hours);
              const selected = d === selectedDate;
              return (
                <button
                  key={d}
                  disabled={!open}
                  aria-pressed={selected}
                  onClick={() => {
                    setSelectedDate(d);
                    setSelectedTime('');
                    setStep(needsEnrollment ? 'details' : 'time');
                  }}
                  className={
                    selected
                      ? 'rounded-lg border border-sun-600 bg-sun-600 px-3 py-3 text-sm font-semibold text-white transition-colors duration-150'
                      : open
                        ? 'rounded-lg border border-white/60 bg-white/60 px-3 py-3 text-sm font-medium text-sand-800 backdrop-blur-md transition-colors duration-150 hover:border-sun-500 hover:bg-white/85'
                        : 'cursor-not-allowed rounded-lg border border-dashed border-sand-200 px-3 py-3 text-sm text-sand-400'
                  }
                >
                  {formatDateShort(d)}
                  {!open && <span className="mt-0.5 block text-[10px] text-sand-400">Closed</span>}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* STEP: details (enroll inline) */}
      {step === 'details' && (
        <FadeUp>
          <Card>
            <button
              onClick={() => setStep('date')}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 transition-colors hover:text-sand-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h1 className="text-xl font-semibold tracking-tight text-sand-900">Quick enrollment</h1>
            <p className="mt-1 text-sm text-sand-600">
              We don't recognize this email yet. Enter your name and code to continue.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const code = (new FormData(e.currentTarget).get('code') as string) ?? '';
                if (studentName.trim().length < 2) return toast.error('Please enter your name');
                if (code.trim().length < 4) return toast.error('Enter the code from your instructor');
                enroll.mutate(code);
              }}
              className="mt-6 space-y-4"
            >
              <Field label="Full name">
                <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Jane Doe" required />
              </Field>
              <Field label="Enrollment code">
                <Input name="code" placeholder="e.g. DRIVE2026" className="font-mono tracking-widest uppercase" required />
              </Field>
              <Button variant="primary" type="submit" loading={enroll.isPending} className="w-full">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </Card>
        </FadeUp>
      )}

      {/* STEP: time */}
      {step === 'time' && (
        <Card>
          <button
            onClick={() => setStep('date')}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 transition-colors hover:text-sand-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-sand-900">Choose a time</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-sand-600">
            <CalendarDays className="h-4 w-4 text-sun-600" /> {formatDateLong(selectedDate)}
          </p>

          {availability.isLoading ? (
            <CenteredSpinner label="Checking availability…" />
          ) : !availability.data || availability.data.slots.length === 0 ? (
            <div className="mt-6 rounded-lg border border-sand-200 bg-sand-50 p-6 text-center text-sm text-sand-600">
              {availability.data?.closed
                ? 'The school is closed on this day.'
                : 'No available times for this date. Try another day.'}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {availability.data.slots.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTime(t);
                    setConfirmOpen(true);
                  }}
                  className="rounded-lg border border-white/60 bg-white/60 px-2 py-2.5 font-mono text-sm font-medium text-sand-800 backdrop-blur-md transition-colors duration-150 hover:border-sun-600 hover:bg-sun-600 hover:text-white"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* STEP: done */}
      {step === 'done' && (
        <FadeUp>
          <Card className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" strokeWidth={1.75} />
            </div>
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-sand-900">Lesson booked</h1>
            <p className="mt-2 text-sm text-sand-600">
              See you on <strong className="text-sand-900">{formatDateLong(selectedDate)}</strong> at{' '}
              <strong className="text-sand-900">{selectedTime}</strong>.
            </p>
            <div className="mx-auto mt-5 max-w-xs space-y-2 rounded-lg border border-sand-200 bg-sand-50 p-4 text-start text-sm text-sand-600">
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-sun-600" /> We'll remind you ~2 hours before.
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-sun-600" /> Please arrive 5 minutes early.
              </p>
            </div>
            <Button
              variant="primary"
              className="mt-6 w-full"
              onClick={() => {
                setSelectedTime('');
                setSelectedDate('');
                setStep('date');
              }}
            >
              Book another lesson
            </Button>
          </Card>
        </FadeUp>
      )}

      {/* Footer: pause */}
      {step !== 'done' && (
        <p className="mt-6 text-center text-xs text-sand-500">
          Need a break?{' '}
          <button
            onClick={() => {
              if (!email) return toast('Enter your email first');
              setPauseOpen(true);
            }}
            className="font-medium text-sand-600 underline transition-colors hover:text-sand-900"
          >
            Pause my lessons
          </button>
        </p>
      )}

      {/* Confirm modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm your lesson"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={book.isPending} onClick={() => book.mutate()}>Confirm booking</Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-sand-600">
          <p>You're booking a driving lesson:</p>
          <div className="rounded-lg border border-sand-200 bg-sand-50 p-4">
            <p className="font-semibold text-sand-900">{formatDateLong(selectedDate)}</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-sand-900">{selectedTime}</p>
          </div>
        </div>
      </Modal>

      {/* Pause modal */}
      <PauseModal
        open={pauseOpen}
        email={email}
        loading={pause.isPending}
        onClose={() => setPauseOpen(false)}
        onConfirm={(code) => pause.mutate(code)}
      />
    </PublicShell>
  );
}

function PauseModal({
  open,
  email,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  email: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: (code: string) => void;
}) {
  const [code, setCode] = useState('');
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pause my lessons"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" loading={loading} onClick={() => onConfirm(code)} disabled={code.length < 4}>
            Pause
          </Button>
        </>
      }
    >
      <p className="text-sm text-sand-600">
        This pauses booking for <strong className="text-sand-900">{email}</strong>. Enter your enrollment code to confirm it's you. Your
        instructor can reactivate you anytime.
      </p>
      <div className="mt-4">
        <Field label="Enrollment code">
          <Input value={code} onChange={(e) => setCode(e.target.value)} className="font-mono tracking-widest" placeholder="Your code" />
        </Field>
      </div>
    </Modal>
  );
}
