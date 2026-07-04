import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, Star } from 'lucide-react';
import { apiError, drivingSchoolApi, reviewsApi } from '../../lib/api';
import { TEMPLATES } from '../../templates/registry';
import { dirForLocale } from '../../lib/templateTheme';
import {
  TemplatedShell,
  BookButton,
  BookCard,
  BookField,
  BookInput,
  BookSpinner,
  BookTextarea,
} from '../../components/public/TemplatedShell';

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '0.25rem' }} role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
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
  const { websiteSlug = '' } = useParams();
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['public-settings', websiteSlug],
    queryFn: () => drivingSchoolApi.getPublicSettings(websiteSlug),
    retry: false,
  });

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
          <p className="book-sub">This review link may be incorrect or no longer active.</p>
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
            Thank you!
          </h1>
          <p className="book-sub" style={{ textAlign: 'center' }}>
            Your review was sent to {settings.name} and will appear on the site once it's approved.
          </p>
          <Link to={`/p/${websiteSlug}`} className="book-btn book-btn-primary book-btn-block" style={{ marginTop: '1.4rem' }}>
            Back to the site
          </Link>
        </BookCard>
      </TemplatedShell>
    );

  return (
    <TemplatedShell {...shellProps}>
      <BookCard>
        <p className="book-eyebrow">Student review</p>
        <h1 className="book-title" style={{ marginTop: '0.6rem' }}>
          How was your experience with {settings.name}?
        </h1>
        <p className="book-sub">Your review helps other learners choose their instructor.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.studentName.trim().length < 2) return toast.error('Please enter your name');
            if (form.comment.trim().length < 5) return toast.error('Please write a few words about your experience');
            submit.mutate();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.4rem' }}
        >
          <BookField label="Your name">
            <BookInput value={form.studentName} onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))} placeholder="Jane Doe" required />
          </BookField>
          <BookField label="Rating">
            <StarPicker value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
          </BookField>
          <BookField label="Your review">
            <BookTextarea
              rows={4}
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="What was learning to drive here like?"
              maxLength={1000}
              required
            />
          </BookField>
          <BookButton variant="primary" type="submit" loading={submit.isPending} className="book-btn-block">
            Send review
          </BookButton>
        </form>
      </BookCard>
    </TemplatedShell>
  );
}
