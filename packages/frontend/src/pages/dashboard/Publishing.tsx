import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, Copy, ExternalLink, Globe, Pencil } from 'lucide-react';
import { apiError, siteUrl, websiteApi } from '../../lib/api';
import { Button, Card, CenteredSpinner, EmptyState, StatusBadge } from '../../components/ui';
import type { Website } from '../../lib/types';

function SiteRow({ website }: { website: Website }) {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const live = website.status === 'PUBLISHED';
  const url = siteUrl(website.slug);

  const publish = useMutation({
    mutationFn: () => websiteApi.publish(website.id),
    onSuccess: () => { toast.success('Published'); qc.invalidateQueries({ queryKey: ['websites'] }); },
    onError: (e) => toast.error(apiError(e).message),
  });
  const unpublish = useMutation({
    mutationFn: () => websiteApi.unpublish(website.id),
    onSuccess: () => { toast.success('Unpublished'); qc.invalidateQueries({ queryKey: ['websites'] }); },
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold tracking-tight">{website.name}</h3>
            <StatusBadge status={website.status} />
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5">
            <Globe className="h-4 w-4 text-zinc-400" />
            <code className="text-sm text-zinc-600">{website.slug}.drivesawa.com</code>
            <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="rounded p-1 hover:bg-zinc-200">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-zinc-400" />}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/editor/${website.id}`} className="btn-secondary"><Pencil className="h-4 w-4" /> Edit</Link>
          {live && <a href={url} target="_blank" rel="noreferrer" className="btn-secondary">Visit <ExternalLink className="h-4 w-4" /></a>}
          {live ? (
            <Button variant="secondary" onClick={() => unpublish.mutate()} loading={unpublish.isPending}>Unpublish</Button>
          ) : (
            <Button onClick={() => publish.mutate()} loading={publish.isPending}>Publish</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function Publishing() {
  const { data: websites, isLoading } = useQuery({ queryKey: ['websites'], queryFn: websiteApi.list });
  if (isLoading) return <CenteredSpinner />;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Publishing</h1>
          <p className="text-zinc-500">Manage where your sites are live.</p>
        </div>
        <Link to="/builder" className="btn-secondary">New site</Link>
      </div>
      {!websites || websites.length === 0 ? (
        <Card><EmptyState title="No sites yet" description="Create your first site from the builder." /></Card>
      ) : (
        <div className="space-y-4">{websites.map((w) => <SiteRow key={w.id} website={w} />)}</div>
      )}
      <p className="text-center text-xs text-zinc-400">Custom domains and per-teacher subdomains are configured at deploy time (wildcard DNS).</p>
    </div>
  );
}
