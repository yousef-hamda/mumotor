import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check } from 'lucide-react';
import { drivingSchoolApi } from '../../lib/api';
import { CenteredSpinner } from '../../components/ui';
import { LogoMark } from '../../components/Logo';
import { titleCase } from '../../lib/utils';
import type { BusinessHours } from '../../lib/types';
import { FadeUp, Stagger } from '../../components/motion';

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
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <CenteredSpinner label="Loading…" />
      </div>
    );

  if (isError || !data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-sand-50 px-4 text-center">
        <div className="glass flex h-14 w-14 items-center justify-center rounded-xl">
          <LogoMark size="sm" />
        </div>
        <h1 className="text-xl font-semibold text-sand-900">School not found</h1>
        <p className="text-sm text-sand-600">This page may be incorrect or no longer published.</p>
        <Link to="/" className="btn-secondary mt-4">Back to Mumotor</Link>
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
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/50 glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <LogoMark size="sm" />
            <span className="font-semibold tracking-tight text-sand-900">{data.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to={enrollHref} className="btn-ghost">Enroll</Link>
            <Link to={bookHref} className="btn-primary">Book a lesson</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-sand-200">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <FadeUp>
              {data.teacherName && (
                <span className="section-eyebrow">{data.teacherName} · Driving Instructor</span>
              )}
              <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-sand-900 sm:text-5xl">
                {data.tagline || 'Your road to confidence'}
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-sand-600">
                Learn to drive with {data.name}. Enroll with your code, then book lessons online whenever it suits you.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={enrollHref} className="btn-primary px-7 py-3.5 text-base">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to={bookHref} className="btn-secondary px-7 py-3.5 text-base">
                  Book a lesson
                </Link>
              </div>
            </FadeUp>
          </div>

          {stats.length > 0 && (
            <FadeUp delay={0.12}>
              <div className="card p-8">
                <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <p className="text-3xl font-semibold tabular-nums tracking-tight text-sand-900">{s.value}</p>
                      <p className="mt-1 text-sm text-sand-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          )}
        </div>
      </section>

      {/* What's included + hours */}
      <section className="border-b border-sand-200 bg-sand-50">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 lg:grid-cols-2">
          <FadeUp>
            <p className="section-eyebrow">What's included</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-sand-900">
              Everything you need to pass
            </h2>
            <ul className="mt-6 space-y-3">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sand-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sun-600 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="section-eyebrow">Hours</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-sand-900">
              When you can book
            </h2>
            <div className="card mt-6 overflow-hidden">
              {DAY_ORDER.map((day) => {
                const d = hours[day];
                const open = d?.isOpen;
                return (
                  <div
                    key={day}
                    className="flex items-center justify-between border-b border-sand-100 px-5 py-3 last:border-0"
                  >
                    <span className="font-medium text-sand-800">{titleCase(day)}</span>
                    <span className={open ? 'text-sm font-medium tabular-nums text-sand-600' : 'text-sm text-sand-400'}>
                      {open ? `${d.open} – ${d.close}` : 'Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Services */}
      {data.services.length > 0 && (
        <section className="mx-auto max-w-5xl px-5 py-16">
          <FadeUp>
            <p className="section-eyebrow">Lessons</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-sand-900">Lesson types</h2>
          </FadeUp>
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
            {data.services.map((s) => (
              <Stagger.Item key={s.name}>
                <div className="card h-full p-6">
                  <h3 className="font-semibold text-sand-900">{s.name}</h3>
                  <p className="mt-1 text-sm text-sand-500">{s.duration} minutes</p>
                  {s.price > 0 && (
                    <p className="mt-4 text-2xl font-semibold tabular-nums tracking-tight text-sand-900">
                      ₪{s.price}
                    </p>
                  )}
                </div>
              </Stagger.Item>
            ))}
          </Stagger>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <FadeUp>
          <div className="glass-dark rounded-2xl px-8 py-16 text-center sm:px-16 sm:py-20">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to get behind the wheel?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sand-300">
              Enroll with the code from your instructor and book your first lesson today.
            </p>
            <Link to={enrollHref} className="btn-primary mt-9 inline-flex px-8 py-4 text-base">
              Enroll now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeUp>
      </section>

      <footer className="border-t border-sand-200 py-8 text-center text-sm text-sand-500">
        {data.name} · Powered by{' '}
        <Link to="/" className="font-semibold text-sand-700 transition-colors hover:text-sun-600">
          Mumotor
        </Link>
      </footer>
    </div>
  );
}
