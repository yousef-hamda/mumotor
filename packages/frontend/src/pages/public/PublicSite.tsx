import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check } from 'lucide-react';
import { drivingSchoolApi } from '../../lib/api';
import { CenteredSpinner } from '../../components/ui';
import { LogoMark } from '../../components/Logo';
import { titleCase } from '../../lib/utils';
import type { BusinessHours } from '../../lib/types';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function PublicSite() {
  const { websiteSlug = '' } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-settings', websiteSlug],
    queryFn: () => drivingSchoolApi.getPublicSettings(websiteSlug),
    retry: false,
  });

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <CenteredSpinner label="Loading…" />
      </div>
    );

  if (isError || !data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-50 text-center">
        <h1 className="text-xl font-bold">School not found</h1>
        <p className="text-sm text-zinc-500">This page may be incorrect or no longer published.</p>
        <Link to="/" className="btn-secondary mt-4">Back to DriveSawa</Link>
      </div>
    );

  const enrollHref = `/p/${websiteSlug}/enroll`;
  const bookHref = `/p/${websiteSlug}/book-lesson`;
  const hours = (data.businessHours ?? {}) as BusinessHours;

  const stats = [
    data.passRate != null && { label: 'First-attempt pass rate', value: `${data.passRate}%` },
    data.experienceYears != null && { label: 'Years of experience', value: `${data.experienceYears}+` },
    data.pricePerClass != null && { label: 'Per lesson', value: `₪${data.pricePerClass}` },
  ].filter(Boolean) as { label: string; value: string }[];

  const included = [
    'Modern dual-control vehicle',
    'Flexible lesson scheduling',
    'Patient, professional instruction',
    'Test-route preparation',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <LogoMark size="sm" />
            <span className="font-bold tracking-tight">{data.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to={enrollHref} className="btn-ghost">Enroll</Link>
            <Link to={bookHref} className="btn-primary">Book a lesson</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            {data.teacherName && <p className="section-eyebrow">{data.teacherName} · Driving Instructor</p>}
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl">
              {data.tagline || 'Your road to confidence'}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-zinc-600">
              Learn to drive with {data.name}. Enroll with your code, then book lessons online whenever it suits you.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={enrollHref} className="btn-primary px-6 py-3 text-base">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to={bookHref} className="btn-secondary px-6 py-3 text-base">
                Book a lesson
              </Link>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
              <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-3xl font-bold tracking-tight text-zinc-900">{s.value}</p>
                    <p className="mt-1 text-sm text-zinc-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* What's included + hours */}
      <section className="border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 lg:grid-cols-2">
          <div>
            <p className="section-eyebrow">What's included</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">Everything you need to pass</h2>
            <ul className="mt-6 space-y-3">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3 text-zinc-700">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" strokeWidth={2} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="section-eyebrow">Hours</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">When you can book</h2>
            <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {DAY_ORDER.map((day) => {
                const d = hours[day];
                const open = d?.isOpen;
                return (
                  <div key={day} className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 last:border-0">
                    <span className="font-medium text-zinc-800">{titleCase(day)}</span>
                    <span className={open ? 'text-sm text-zinc-600' : 'text-sm text-zinc-400'}>
                      {open ? `${d.open} – ${d.close}` : 'Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      {data.services.length > 0 && (
        <section className="mx-auto max-w-5xl px-5 py-16">
          <p className="section-eyebrow">Lessons</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">Lesson types</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.services.map((s) => (
              <div key={s.name} className="rounded-xl border border-zinc-200 p-5">
                <h3 className="font-semibold text-zinc-900">{s.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{s.duration} minutes</p>
                {s.price > 0 && <p className="mt-3 text-lg font-bold text-zinc-900">₪{s.price}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="rounded-2xl bg-zinc-900 px-8 py-14 text-center sm:px-16">
          <h2 className="text-3xl font-bold tracking-tight text-white">Ready to get behind the wheel?</h2>
          <p className="mx-auto mt-3 max-w-lg text-zinc-300">
            Enroll with the code from your instructor and book your first lesson today.
          </p>
          <Link to={enrollHref} className="btn mt-8 bg-white px-6 py-3 text-base font-semibold text-zinc-900 hover:bg-zinc-100">
            Enroll now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500">
        {data.name} · Powered by <span className="font-semibold text-zinc-700">DriveSawa</span>
      </footer>
    </div>
  );
}
