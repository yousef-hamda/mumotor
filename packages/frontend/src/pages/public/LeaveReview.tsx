import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTenantSlug } from '../../lib/tenant';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, Star } from 'lucide-react';
import { apiError, drivingSchoolApi, reviewsApi } from '../../lib/api';
import { TEMPLATES } from '../../templates/registry';
import { dirForLocale } from '../../lib/templateTheme';
import { bookLocale, bookT, type BookLocale } from '../../lib/bookingStrings';
import {
  TemplatedShell,
  BookButton,
  BookCard,
  BookField,
  BookInput,
  BookSpinner,
  BookTextarea,
} from '../../components/public/TemplatedShell';

function StarPicker({ value, onChange, L }: { value: number; onChange: (n: number) => void; L: BookLocale }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '0.25rem' }} role="radiogroup" aria-label={bookT(L, 'rating')}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={n === 1 ? bookT(L, 'star1') : bookT(L, 'starN', { n })}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem' }}
          >
            <Star
              style={{ height: '1.7rem', width: '1.7rem' }}
              fill={on ? 'var(--book-accent)' : 'none'}
              color={on ? 'var(--book-accent)' : 'var(--book-muted)'}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function LeaveReview() {
  const websiteSlug = useTenantSlug();
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['public-settings', websiteSlug],
    queryFn: () => drivingSchoolApi.getPublicSettings(websiteSlug),
    retry: false,
  });

  const L = bookLocale(settings?.locale);
  const [form, setForm] = useState({ studentName: '', rating: 5, comment: '' });
  const [done, setDone] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        websiteId: settings!.id,
        studentName: form.studentName.trim(),
        rating: form.rating,
        comment: form.comment.trim(),
      }),
    onSuccess: () => setDone(true),
    onError: (e) => toast.error(apiError(e).message),
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
          <p className="book-sub">{bookT(L, 'notFoundReview')}</p>
        </BookCard>
      </TemplatedShell>
    );

  if (done)
    return (
      <TemplatedShell {...shellProps}>
        <BookCard>
          <div className="book-check">
            <CheckCircle2 style={{ height: '2.2rem', width: '2.2rem' }} strokeWidth={1.75} />
          </div>
          <h1 className="book-title" style={{ marginTop: '1rem', textAlign: 'center' }}>
            {bookT(L, 'thankYou')}
          </h1>
          <p className="book-sub" style={{ textAlign: 'center' }}>
            {bookT(L, 'reviewSentSub', { name: settings.name })}
          </p>
          <Link to={`/p/${websiteSlug}`} className="book-btn book-btn-primary book-btn-block" style={{ marginTop: '1.4rem' }}>
            {bookT(L, 'backToSite')}
          </Link>
        </BookCard>
      </TemplatedShell>
    );

  return (
    <TemplatedShell {...shellProps}>
      <BookCard>
        <p className="book-eyebrow">{bookT(L, 'studentReview')}</p>
        <h1 className="book-title" style={{ marginTop: '0.6rem' }}>
          {bookT(L, 'reviewTitle', { name: settings.name })}
        </h1>
        <p className="book-sub">{bookT(L, 'reviewHelper')}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.studentName.trim().length < 2) return toast.error(bookT(L, 'errName'));
            if (form.comment.trim().length < 5) return toast.error(bookT(L, 'errComment'));
            submit.mutate();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.4rem' }}
        >
          <BookField label={bookT(L, 'yourName')}>
            <BookInput value={form.studentName} onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))} placeholder={bookT(L, 'phName')} required />
          </BookField>
          <BookField label={bookT(L, 'rating')}>
            <StarPicker value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} L={L} />
          </BookField>
          <BookField label={bookT(L, 'yourReview')}>
            <BookTextarea
              rows={4}
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder={bookT(L, 'phReview')}
              maxLength={1000}
              required
            />
          </BookField>
          <BookButton variant="primary" type="submit" loading={submit.isPending} className="book-btn-block">
            {bookT(L, 'sendReview')}
          </BookButton>
        </form>
      </BookCard>
    </TemplatedShell>
  );
}
