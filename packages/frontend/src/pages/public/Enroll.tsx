import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { apiError, drivingSchoolApi } from '../../lib/api';
import { Button, Card, CenteredSpinner, Field, Input } from '../../components/ui';
import { PublicShell } from '../../components/PublicShell';

export default function Enroll() {
  const { websiteSlug = '' } = useParams();
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['public-settings', websiteSlug],
    queryFn: () => drivingSchoolApi.getPublicSettings(websiteSlug),
    retry: false,
  });

  const [form, setForm] = useState({ studentName: '', studentEmail: '', studentPhone: '', enrollmentCode: '' });
  const [done, setDone] = useState(false);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === 'enrollmentCode' ? e.target.value.toUpperCase() : e.target.value }));

  const enroll = useMutation({
    mutationFn: () =>
      drivingSchoolApi.enroll({
        websiteId: settings!.id,
        studentName: form.studentName.trim(),
        studentEmail: form.studentEmail.trim(),
        studentPhone: form.studentPhone.trim() || undefined,
        enrollmentCode: form.enrollmentCode.trim(),
      }),
    onSuccess: () => setDone(true),
    onError: (e) => {
      const { status, message } = apiError(e);
      if (status === 409) setAlreadyEnrolled(true);
      else toast.error(message);
    },
  });

  if (isLoading) return <PublicShell><CenteredSpinner label="Loading…" /></PublicShell>;
  if (isError || !settings)
    return (
      <PublicShell>
        <Card className="text-center">
          <h1 className="text-lg font-bold">School not found</h1>
          <p className="mt-1 text-sm text-zinc-500">This enrollment link may be incorrect or no longer active.</p>
        </Card>
      </PublicShell>
    );

  const bookHref = `/p/${websiteSlug}/book-lesson`;

  if (done || alreadyEnrolled)
    return (
      <PublicShell schoolName={settings.name} slug={websiteSlug}>
        <Card className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" strokeWidth={1.5} />
          <h1 className="mt-4 text-xl font-bold tracking-tight">
            {alreadyEnrolled ? "You're already enrolled" : "You're enrolled"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {alreadyEnrolled
              ? 'This email is already registered. You can go straight to booking your next lesson.'
              : `Welcome to ${settings.name}. You'll get an email each morning when booking opens, and you can book a lesson anytime.`}
          </p>
          <Link to={bookHref} className="btn-primary mt-6 w-full">
            Book a lesson <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </PublicShell>
    );

  return (
    <PublicShell schoolName={settings.name} slug={websiteSlug}>
      <Card>
        <h1 className="text-xl font-bold tracking-tight">Enroll at {settings.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter your details and the code your instructor gave you to get started.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.studentName.trim().length < 2) return toast.error('Please enter your name');
            if (form.enrollmentCode.trim().length < 4) return toast.error('Enrollment code looks too short');
            enroll.mutate();
          }}
          className="mt-6 space-y-4"
        >
          <Field label="Full name">
            <Input value={form.studentName} onChange={set('studentName')} placeholder="Jane Doe" required />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.studentEmail} onChange={set('studentEmail')} placeholder="jane@example.com" required />
          </Field>
          <Field label="Phone (optional)">
            <Input value={form.studentPhone} onChange={set('studentPhone')} placeholder="+972 50 123 4567" />
          </Field>
          <Field label="Enrollment code">
            <Input
              value={form.enrollmentCode}
              onChange={set('enrollmentCode')}
              placeholder="e.g. DRIVE2026"
              className="font-mono tracking-widest"
              required
            />
          </Field>
          <Button type="submit" loading={enroll.isPending} className="w-full">
            Enroll
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-zinc-500">
          Already enrolled?{' '}
          <Link to={bookHref} className="font-semibold text-brand-700 hover:underline">
            Book a lesson
          </Link>
        </p>
      </Card>
    </PublicShell>
  );
}
