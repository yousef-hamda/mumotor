import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users, CalendarCheck, ExternalLink, ArrowRight, Plus, Pencil, GraduationCap, Copy, Check } from 'lucide-react';
import { websiteApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Card, CenteredSpinner, StatusBadge } from '../../components/ui';
import { FadeUp, Stagger } from '../../components/motion';
import type { Website } from '../../lib/types';

/** Copy the public site link to the clipboard so the teacher can send it to students. */
function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy — copy it manually');
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-sand-200 bg-white px-2.5 py-1 text-xs font-medium text-sand-700 transition-colors hover:bg-sand-50"
      aria-label="Copy site link"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}

/** Empty state: send the teacher into the full guided builder (same flow as the
 *  landing hero's "Build your site"), not a bare inline create. */
function CreateWebsite() {
  return (
    <div className="mx-auto max-w-lg">
      <Card className="p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sand-100 text-sand-700">
          <GraduationCap strokeWidth={1.75} className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-sand-900">Create your website</h2>
        <p className="mx-auto mb-7 mt-2 max-w-sm text-sm text-sand-600">
          Build your driving-school website in a few guided steps — pick a design, add your details, then publish your public booking page.
        </p>
        <Link to="/builder" className="btn-primary w-full">
          <Plus className="h-4 w-4" /> Create your website
        </Link>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-sand-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sand-100 text-sand-700">{icon}</span>
        <span className="text-sm font-medium text-sand-600">{label}</span>
      </div>
      <p className="mt-4 text-4xl font-semibold tracking-tight tabular-nums text-sand-900">{value}</p>
    </div>
  );
}

function SiteOverview({ website }: { website: Website }) {
  const live = website.status === 'PUBLISHED';
  const liveUrl = `${window.location.origin}/p/${website.slug}`;
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-sand-200 bg-sand-50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-semibold tracking-tight text-sand-900">{website.name}</h3>
              <StatusBadge status={website.status} />
            </div>
            {website.tagline && <p className="mt-0.5 text-sm text-sand-600">{website.tagline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-1.5 rounded-md border border-sand-200 bg-white px-2.5 py-1 font-mono text-[11px] text-sand-600">
                {liveUrl.replace(/^https?:\/\//, '')}
              </p>
              <CopyLinkButton url={liveUrl} />
            </div>
            <p className="mt-1.5 text-xs text-sand-500">Share this link with your students so they can enroll and book.</p>
          </div>
          {live && (
            <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-secondary">
              View live site <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard icon={<Users strokeWidth={1.75} className="h-5 w-5" />} label="Students enrolled" value={website._count?.enrollments ?? 0} />
          <StatCard icon={<CalendarCheck strokeWidth={1.75} className="h-5 w-5" />} label="Lessons booked" value={website._count?.bookings ?? 0} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/dashboard/driving-school" className="btn-primary">
            Manage school <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to={`/customize/${website.id}`} className="btn-secondary">
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
            <h1 className="text-3xl font-semibold tracking-tight text-sand-900">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sand-600">Here's how your driving school is doing today.</p>
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
