import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTenantSlug } from '../../lib/tenant';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { apiError, drivingSchoolApi } from '../../lib/api';
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

export default function Enroll() {
  const websiteSlug = useTenantSlug();
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['public-settings', websiteSlug],
    queryFn: () => drivingSchoolApi.getPublicSettings(websiteSlug),
    retry: false,
  });

  const L = bookLocale(settings?.locale);

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
    locale: settings?.locale,
    schoolName: settings?.name,
    logoSrc: settings?.logoSrc,
    publicSlug: websiteSlug,
  };

  if (isLoading)
    return (
      <TemplatedShell slug={slug} publicSlug={websiteSlug}>
        <BookSpinner label={bookT(L, 'loading')} />
      </TemplatedShell>
    );
  if (isError || !settings)
    return (
      <TemplatedShell slug={slug} publicSlug={websiteSlug}>
        <BookCard>
          <h1 className="book-title">{bookT(L, 'schoolNotFound')}</h1>
          <p className="book-sub">{bookT(L, 'notFoundEnroll')}</p>
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
            {alreadyEnrolled ? bookT(L, 'alreadyEnrolledTitle') : bookT(L, 'enrolledTitle')}
          </h1>
          <p className="book-sub" style={{ textAlign: 'center' }}>
            {alreadyEnrolled
              ? bookT(L, 'alreadyEnrolledSub')
              : bookT(L, 'enrolledSub', { name: settings.name })}
          </p>
          <Link to={bookHref} className="book-btn book-btn-primary book-btn-block" style={{ marginTop: '1.4rem' }}>
            {bookT(L, 'bookLesson')} <ArrowRight style={{ height: '1rem', width: '1rem' }} />
          </Link>
          <Link to={accountHref} className="book-btn book-btn-secondary book-btn-block" style={{ marginTop: '0.6rem' }}>
            {bookT(L, 'goToAccount')}
          </Link>
        </BookCard>
      </TemplatedShell>
    );

  return (
    <TemplatedShell {...shellProps}>
      <BookCard>
        <p className="book-eyebrow">{bookT(L, 'enrollEyebrow')}</p>
        <h1 className="book-title" style={{ marginTop: '0.6rem' }}>
          {bookT(L, 'enrollTitle', { name: settings.name })}
        </h1>
        <p className="book-sub">{bookT(L, 'enrollHelper')}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.studentName.trim().length < 2) return toast.error(bookT(L, 'errName'));
            if (!/^[+\d][\d\s-]{6,18}$/.test(form.studentPhone.trim())) return toast.error(bookT(L, 'errPhone'));
            if (form.enrollmentCode.trim().length < 4) return toast.error(bookT(L, 'errCodeShort'));
            enroll.mutate();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.4rem' }}
        >
          <BookField label={bookT(L, 'fullName')}>
            <BookInput value={form.studentName} onChange={set('studentName')} placeholder={bookT(L, 'phName')} required />
          </BookField>
          <BookField label={bookT(L, 'emailLabel')}>
            <BookInput type="email" value={form.studentEmail} onChange={set('studentEmail')} placeholder={bookT(L, 'phEmail')} required />
          </BookField>
          <BookField label={bookT(L, 'phoneLabel')}>
            <BookInput type="tel" value={form.studentPhone} onChange={set('studentPhone')} placeholder={bookT(L, 'phPhone')} required />
          </BookField>
          <BookField label={bookT(L, 'enrollmentCode')}>
            <BookInput
              value={form.enrollmentCode}
              onChange={set('enrollmentCode')}
              placeholder={bookT(L, 'phCode')}
              style={{ fontFamily: 'var(--book-font-display)', letterSpacing: '0.15em' }}
              required
            />
          </BookField>
          <BookButton variant="primary" type="submit" loading={enroll.isPending} className="book-btn-block">
            {bookT(L, 'enroll')}
          </BookButton>
        </form>

        <p className="book-sub" style={{ textAlign: 'center', marginTop: '1.2rem' }}>
          {bookT(L, 'alreadyEnrolledQ')}{' '}
          <Link to={bookHref} className="book-link">
            {bookT(L, 'bookLesson')}
          </Link>
        </p>
      </BookCard>
    </TemplatedShell>
  );
}
