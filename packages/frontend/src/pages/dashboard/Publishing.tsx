import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, Copy, ExternalLink, Globe, Pencil } from 'lucide-react';
import { apiError, siteUrl, websiteApi } from '../../lib/api';
import { Button, Card, CenteredSpinner, EmptyState, StatusBadge } from '../../components/ui';
import { FadeUp, Stagger } from '../../components/motion';
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
    <div className="card rounded-xl">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-sand-900">{website.name}</h3>
              <StatusBadge status={website.status} />
            </div>
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-md border border-sand-200 bg-sand-50 px-3 py-1">
              <Globe className="h-3 w-3 shrink-0 text-sand-500" />
              <code className="text-[12px] text-sand-600">{website.slug}.mumotor.com</code>
              <button
                onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="rounded-md p-1 text-sand-500 transition-colors hover:bg-sand-200 hover:text-sand-800"
                aria-label="Copy site URL"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/editor/${website.id}`} className="btn-secondary">
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            {live && (
              <a href={url} target="_blank" rel="noreferrer" className="btn-secondary">
                Visit <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {live ? (
              <Button variant="secondary" onClick={() => unpublish.mutate()} loading={unpublish.isPending}>
                Unpublish
              </Button>
            ) : (
              <Button variant="sun" onClick={() => publish.mutate()} loading={publish.isPending}>
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Publishing() {
  const { data: websites, isLoading } = useQuery({ queryKey: ['websites'], queryFn: websiteApi.list });
  if (isLoading) return <CenteredSpinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <FadeUp>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-sand-900">
              Your sites
            </h1>
            <p className="mt-1 text-sand-600">Manage where your sites are live.</p>
          </div>
          <Link to="/builder" className="btn-secondary">
            New site
          </Link>
        </div>
      </FadeUp>

      {!websites || websites.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Globe className="h-10 w-10 text-sand-300" />}
            title="No sites yet"
            description="Create your first site from the builder."
          />
        </Card>
      ) : (
        <Stagger className="space-y-4">
          {websites.map((w) => (
            <Stagger.Item key={w.id}>
              <SiteRow website={w} />
            </Stagger.Item>
          ))}
        </Stagger>
      )}

      <p className="text-center text-xs text-sand-500">
        Custom domains and per-teacher subdomains are configured at deploy time (wildcard DNS).
      </p>
    </div>
  );
}
