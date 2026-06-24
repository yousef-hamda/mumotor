import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Sun } from 'lucide-react';
import { drivingSchoolApi } from '../../lib/api';
import { CenteredSpinner } from '../../components/ui';
import { LogoMark } from '../../components/Logo';
import { titleCase } from '../../lib/utils';
import type { BusinessHours } from '../../lib/types';
import { FadeUp, Stagger, Tilt } from '../../components/motion';

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-sand-50 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sand-200 bg-white shadow-card">
          <Sun className="h-6 w-6 text-sun-500" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-xl font-semibold text-sand-950">School not found</h1>
        <p className="text-sm text-sand-500">This page may be incorrect or no longer published.</p>
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
    <div className="min-h-screen bg-sand-50">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-sunrise-soft opacity-30 blur-3xl" />

      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-sand-200/60 bg-sand-50/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <LogoMark size="sm" />
            <span className="font-display font-semibold tracking-tight text-sand-950">{data.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to={enrollHref} className="btn-ghost">Enroll</Link>
            <Link to={bookHref} className="btn-primary">Book a lesson</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        {/* warm dot texture */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-dots-warm opacity-60" />
        <div className="pointer-events-none absolute -top-24 -end-24 -z-10 h-[480px] w-[480px] rounded-full sun-glow animate-sun-pulse blur-2xl" />

        <div className="mx-auto grid max-w-5xl items-center gap-12 px-5 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <FadeUp>
              {data.teacherName && (
                <span className="section-eyebrow">
                  <span className="h-px w-5 bg-sun-500" />
                  {data.teacherName} · Driving Instructor
                </span>
              )}
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tightest text-sand-950 sm:text-5xl">
                {data.tagline || 'Your road to confidence'}
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-sand-700">
                Learn to drive with {data.name}. Enroll with your code, then book lessons online whenever it suits you.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={enrollHref} className="btn-sun shine px-7 py-3.5 text-base">
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
              <Tilt max={6} glare>
                <div className="card bg-white p-8 shadow-elevated">
                  {/* sunrise accent bar */}
                  <div className="mb-6 h-1 w-16 rounded-full bg-sunrise" />
                  <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
                    {stats.map((s) => (
                      <div key={s.label}>
                        <p className="font-display text-3xl font-semibold tracking-tightest text-sand-950">{s.value}</p>
                        <p className="mt-1 text-sm text-sand-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Tilt>
            </FadeUp>
          )}
        </div>
      </section>

      {/* What's included + hours */}
      <section className="border-y border-sand-200/70 bg-white/60 backdrop-blur">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 lg:grid-cols-2">
          <FadeUp>
            <p className="section-eyebrow">
              <span className="h-px w-5 bg-sun-500" /> What's included
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tightest text-sand-950">
              Everything you need to pass
            </h2>
            <ul className="mt-6 space-y-3">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sand-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sand-200 bg-white text-sun-500 shadow-ring">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="section-eyebrow">
              <span className="h-px w-5 bg-sun-500" /> Hours
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tightest text-sand-950">
              When you can book
            </h2>
            <div className="mt-6 overflow-hidden rounded-3xl border border-sand-200/80 bg-white shadow-card">
              {DAY_ORDER.map((day) => {
                const d = hours[day];
                const open = d?.isOpen;
                return (
                  <div
                    key={day}
                    className="flex items-center justify-between border-b border-sand-100 px-5 py-3 last:border-0"
                  >
                    <span className="font-semibold text-sand-800">{titleCase(day)}</span>
                    <span className={open ? 'text-sm font-medium text-sand-600' : 'text-sm text-sand-400'}>
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
            <p className="section-eyebrow">
              <span className="h-px w-5 bg-sun-500" /> Lessons
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tightest text-sand-950">Lesson types</h2>
          </FadeUp>
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
            {data.services.map((s) => (
              <Stagger.Item key={s.name}>
                <Tilt max={5} glare>
                  <div className="card group h-full p-6 transition-shadow duration-300 hover:shadow-elevated">
                    {/* accent hairline */}
                    <span className="mb-4 flex h-px w-8 rounded-full bg-sun-400 opacity-70" />
                    <h3 className="font-semibold text-sand-950">{s.name}</h3>
                    <p className="mt-1 text-sm text-sand-500">{s.duration} minutes</p>
                    {s.price > 0 && (
                      <p className="mt-4 font-display text-2xl font-semibold tracking-tight text-sand-950">
                        ₪{s.price}
                      </p>
                    )}
                  </div>
                </Tilt>
              </Stagger.Item>
            ))}
          </Stagger>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <FadeUp>
          <div className="relative isolate overflow-hidden rounded-4xl bg-dusk px-8 py-16 text-center shadow-elevated sm:px-16 sm:py-20">
            <div className="pointer-events-none absolute -end-16 -top-16 h-72 w-72 rounded-full sun-glow animate-sun-pulse blur-2xl" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-grain opacity-[0.15]" />
            <Sun className="mx-auto h-7 w-7 text-sun-300 opacity-80" strokeWidth={1.5} />
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tightest text-white sm:text-4xl">
              Ready to get behind the wheel?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sand-200">
              Enroll with the code from your instructor and book your first lesson today.
            </p>
            <Link to={enrollHref} className="btn-sun shine mt-9 inline-flex px-8 py-4 text-base">
              Enroll now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeUp>
      </section>

      <footer className="border-t border-sand-200/70 py-8 text-center text-sm text-sand-500">
        {data.name} · Powered by{' '}
        <Link to="/" className="font-semibold text-sand-700 transition-colors hover:text-sun-700">
          Mumotor
        </Link>
      </footer>
    </div>
  );
}
