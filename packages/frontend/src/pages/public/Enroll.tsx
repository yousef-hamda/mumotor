import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { apiError, drivingSchoolApi } from '../../lib/api';
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
        studentPhone: form.studentPhone.trim(),
        enrollmentCode: form.enrollmentCode.trim(),
      }),
    onSuccess: () => setDone(true),
    onError: (e) => {
      const { status, message } = apiError(e);
      if (status === 409) setAlreadyEnrolled(true);
      else toast.error(message);
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
          <p className="book-sub">This enrollment link may be incorrect or no longer active.</p>
        </BookCard>
      </TemplatedShell>
    );

  const bookHref = `/p/${websiteSlug}/book-lesson`;
  const accountHref = `/p/${websiteSlug}/account`;

  if (done || alreadyEnrolled)
    return (
      <TemplatedShell {...shellProps}>
        <BookCard>
          <div className="book-check">
            <CheckCircle2 style={{ height: '2.2rem', width: '2.2rem' }} strokeWidth={1.75} />
          </div>
          <h1 className="book-title" style={{ marginTop: '1rem', textAlign: 'center' }}>
            {alreadyEnrolled ? "You're already enrolled" : "You're enrolled"}
          </h1>
          <p className="book-sub" style={{ textAlign: 'center' }}>
            {alreadyEnrolled
              ? 'This email is already registered. You can go straight to booking your next lesson.'
              : `Welcome to ${settings.name}. You can book a lesson online whenever it suits you.`}
          </p>
          <Link to={bookHref} className="book-btn book-btn-primary book-btn-block" style={{ marginTop: '1.4rem' }}>
            Book a lesson <ArrowRight style={{ height: '1rem', width: '1rem' }} />
          </Link>
          <Link to={accountHref} className="book-btn book-btn-secondary book-btn-block" style={{ marginTop: '0.6rem' }}>
            Go to my account
          </Link>
        </BookCard>
      </TemplatedShell>
    );

  return (
    <TemplatedShell {...shellProps}>
      <BookCard>
        <p className="book-eyebrow">Student enrollment</p>
        <h1 className="book-title" style={{ marginTop: '0.6rem' }}>
          Enroll at {settings.name}
        </h1>
        <p className="book-sub">Enter your details and the code your instructor gave you to get started.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.studentName.trim().length < 2) return toast.error('Please enter your name');
            if (!/^[+\d][\d\s-]{6,18}$/.test(form.studentPhone.trim())) return toast.error('Please enter a valid phone number');
            if (form.enrollmentCode.trim().length < 4) return toast.error('Enrollment code looks too short');
            enroll.mutate();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.4rem' }}
        >
          <BookField label="Full name">
            <BookInput value={form.studentName} onChange={set('studentName')} placeholder="Jane Doe" required />
          </BookField>
          <BookField label="Email">
            <BookInput type="email" value={form.studentEmail} onChange={set('studentEmail')} placeholder="jane@example.com" required />
          </BookField>
          <BookField label="Phone">
            <BookInput type="tel" value={form.studentPhone} onChange={set('studentPhone')} placeholder="+972 50 123 4567" required />
          </BookField>
          <BookField label="Enrollment code">
            <BookInput
              value={form.enrollmentCode}
              onChange={set('enrollmentCode')}
              placeholder="e.g. DRIVE2026"
              style={{ fontFamily: 'var(--book-font-display)', letterSpacing: '0.15em' }}
              required
            />
          </BookField>
          <BookButton variant="primary" type="submit" loading={enroll.isPending} className="book-btn-block">
            Enroll
          </BookButton>
        </form>

        <p className="book-sub" style={{ textAlign: 'center', marginTop: '1.2rem' }}>
          Already enrolled?{' '}
          <Link to={bookHref} className="book-link">
            Book a lesson
          </Link>
        </p>
      </BookCard>
    </TemplatedShell>
  );
}
