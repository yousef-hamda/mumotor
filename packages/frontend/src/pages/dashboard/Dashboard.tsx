import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users, CalendarCheck, ExternalLink, ArrowRight, Plus, Pencil, Sun } from 'lucide-react';
import { apiError, siteUrl, websiteApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Button, Card, CenteredSpinner, Field, Input, StatusBadge } from '../../components/ui';
import { FadeUp, Stagger } from '../../components/motion';
import type { Website } from '../../lib/types';

function CreateWebsite() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('Your Road to Confidence');

  const create = useMutation({
    mutationFn: () => websiteApi.create({ name, tagline }),
    onSuccess: () => {
      toast.success('Your driving school is ready');
      qc.invalidateQueries({ queryKey: ['websites'] });
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <div className="mx-auto max-w-lg">
      <Card className="relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full sun-glow blur-2xl" />
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sun-200 bg-sun-50 text-sun-600">
          <Sun className="h-5 w-5" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-sand-950">Set up your driving school</h2>
        <p className="mb-6 mt-2 text-sm text-sand-500">
          This creates your public booking page and student roster. You can fine-tune everything afterwards.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return toast.error('Please enter a name');
            create.mutate();
          }}
          className="space-y-4"
        >
          <Field label="School / business name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="David's Driving School" required />
          </Field>
          <Field label="Tagline (optional)">
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Your Road to Confidence" />
          </Field>
          <Button type="submit" variant="sun" loading={create.isPending} className="w-full">
            <Plus className="h-4 w-4" /> Create driving school
          </Button>
        </form>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string | number; accent: string }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-sand-200/80 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent}`}>{icon}</span>
        <span className="text-sm font-medium text-sand-500">{label}</span>
      </div>
      <p className="mt-4 font-display text-4xl font-semibold tracking-tight text-sand-950">{value}</p>
    </div>
  );
}

function SiteOverview({ website }: { website: Website }) {
  const live = website.status === 'PUBLISHED';
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative border-b border-sand-100 bg-gradient-to-br from-sand-50 to-white p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full sun-glow opacity-60 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-display text-xl font-semibold tracking-tight text-sand-950">{website.name}</h3>
              <StatusBadge status={website.status} />
            </div>
            {website.tagline && <p className="mt-0.5 text-sm text-sand-500">{website.tagline}</p>}
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-sand-200/80 bg-sand-50 px-2.5 py-1 font-mono text-[11px] text-sand-500">
              {website.slug}.mumotor.com
            </p>
          </div>
          {live && (
            <a href={siteUrl(website.slug)} target="_blank" rel="noreferrer" className="btn-secondary">
              View live site <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard icon={<Users className="h-5 w-5 text-sun-700" />} accent="bg-sun-100" label="Students enrolled" value={website._count?.enrollments ?? 0} />
          <StatCard icon={<CalendarCheck className="h-5 w-5 text-ember-600" />} accent="bg-ember-100" label="Lessons booked" value={website._count?.bookings ?? 0} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/dashboard/driving-school" className="btn-primary">
            Manage school <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to={`/editor/${website.id}`} className="btn-secondary">
            <Pencil className="h-4 w-4" /> Edit site
          </Link>
          <a href={`/p/${website.slug}/enroll`} className="btn-ghost" target="_blank" rel="noreferrer">
            Enrollment link
          </a>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const { data: websites, isLoading } = useQuery({ queryKey: ['websites'], queryFn: websiteApi.list });

  if (isLoading) return <CenteredSpinner label="Loading your dashboard" />;

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <FadeUp>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-eyebrow"><Sun className="h-3.5 w-3.5 text-sun-500" /> Dashboard</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tightest text-sand-950">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sand-500">Here's how your driving school is doing today.</p>
          </div>
          {websites && websites.length > 0 && (
            <Link to="/builder" className="btn-secondary">
              <Plus className="h-4 w-4" /> New site
            </Link>
          )}
        </div>
      </FadeUp>

      {!websites || websites.length === 0 ? (
        <CreateWebsite />
      ) : (
        <Stagger className="space-y-6">
          {websites.map((w) => (
            <Stagger.Item key={w.id}>
              <SiteOverview website={w} />
            </Stagger.Item>
          ))}
        </Stagger>
      )}
    </div>
  );
}
