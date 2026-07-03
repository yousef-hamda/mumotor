import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, Star } from 'lucide-react';
import { apiError, drivingSchoolApi, reviewsApi } from '../../lib/api';
import { Button, Card, CenteredSpinner, Field, Input, Textarea } from '../../components/ui';
import { PublicShell } from '../../components/PublicShell';
import { FadeUp } from '../../components/motion';
import { cn } from '../../lib/utils';

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="rounded-md p-1 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              'h-7 w-7 transition-colors',
              n <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-sand-300'
            )}
          />
        </button>
      ))}
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

  if (isLoading) return <PublicShell><CenteredSpinner label="Loading…" /></PublicShell>;
  if (isError || !settings)
    return (
      <PublicShell>
        <Card className="text-center">
          <h1 className="text-lg font-semibold text-sand-900">School not found</h1>
          <p className="mt-1 text-sm text-sand-600">This review link may be incorrect or no longer active.</p>
        </Card>
      </PublicShell>
    );

  if (done)
    return (
      <PublicShell schoolName={settings.name} slug={websiteSlug}>
        <FadeUp>
          <Card className="text-center">
            <div className="mx-auto mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" strokeWidth={1.75} />
            </div>
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-sand-900">Thank you!</h1>
            <p className="mt-2 text-sm leading-relaxed text-sand-600">
              Your review was sent to {settings.name} and will appear on the site once it's approved.
            </p>
            <Link to={`/p/${websiteSlug}`} className="btn-primary mt-6 w-full">
              Back to the site
            </Link>
          </Card>
        </FadeUp>
      </PublicShell>
    );

  return (
    <PublicShell schoolName={settings.name} slug={websiteSlug}>
      <FadeUp>
        <Card>
          <p className="section-eyebrow">Student review</p>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-sand-900">
            How was your experience with {settings.name}?
          </h1>
          <p className="mt-1 text-sm text-sand-600">
            Your review helps other learners choose their instructor.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.studentName.trim().length < 2) return toast.error('Please enter your name');
              if (form.comment.trim().length < 5) return toast.error('Please write a few words about your experience');
              submit.mutate();
            }}
            className="mt-6 space-y-4"
          >
            <Field label="Your name">
              <Input value={form.studentName} onChange={(e) => setForm((f) => ({ ...f, studentName: e.target.value }))} placeholder="Jane Doe" required />
            </Field>
            <Field label="Rating">
              <StarPicker value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
            </Field>
            <Field label="Your review">
              <Textarea
                rows={4}
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="What was learning to drive here like?"
                maxLength={1000}
                required
              />
            </Field>
            <Button variant="primary" type="submit" loading={submit.isPending} className="w-full">
              Send review
            </Button>
          </form>
        </Card>
      </FadeUp>
    </PublicShell>
  );
}
