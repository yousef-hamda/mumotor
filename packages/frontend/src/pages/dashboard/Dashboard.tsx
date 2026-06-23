import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users, CalendarCheck, ExternalLink, ArrowRight, Plus, Pencil } from 'lucide-react';
import { apiError, siteUrl, websiteApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Button, Card, CenteredSpinner, Field, Input, StatusBadge } from '../../components/ui';
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
      <Card className="p-8">
        <h2 className="text-xl font-bold tracking-tight">Set up your driving school</h2>
        <p className="mb-6 mt-1 text-sm text-zinc-500">
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
          <Button type="submit" loading={create.isPending} className="w-full">
            <Plus className="h-4 w-4" /> Create driving school
          </Button>
        </form>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center gap-3 text-zinc-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">{value}</p>
    </div>
  );
}

function SiteOverview({ website }: { website: Website }) {
  const live = website.status === 'PUBLISHED';
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight">{website.name}</h3>
            <StatusBadge status={website.status} />
          </div>
          {website.tagline && <p className="text-sm text-zinc-500">{website.tagline}</p>}
          <p className="mt-1 font-mono text-xs text-zinc-400">{website.slug}.drivesawa.com</p>
        </div>
        {live && (
          <a href={siteUrl(website.slug)} target="_blank" rel="noreferrer" className="btn-secondary">
            View live site <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <StatCard icon={<Users className="h-5 w-5" />} label="Students enrolled" value={website._count?.enrollments ?? 0} />
        <StatCard icon={<CalendarCheck className="h-5 w-5" />} label="Lessons booked" value={website._count?.bookings ?? 0} />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
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
    </Card>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const { data: websites, isLoading } = useQuery({ queryKey: ['websites'], queryFn: websiteApi.list });

  if (isLoading) return <CenteredSpinner label="Loading your dashboard" />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-zinc-500">An overview of your driving school.</p>
        </div>
        {websites && websites.length > 0 && (
          <Link to="/builder" className="btn-secondary">
            <Plus className="h-4 w-4" /> New site
          </Link>
        )}
      </div>

      {!websites || websites.length === 0 ? (
        <CreateWebsite />
      ) : (
        <div className="space-y-6">
          {websites.map((w) => (
            <SiteOverview key={w.id} website={w} />
          ))}
        </div>
      )}
    </div>
  );
}
