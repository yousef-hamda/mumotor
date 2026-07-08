import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, Copy, ExternalLink, Globe, Sparkles } from 'lucide-react';
import { apiError, websiteApi } from '../../lib/api';
import { Button, Card, CenteredSpinner, EmptyState, StatusBadge } from '../../components/ui';
import { FadeUp, Stagger } from '../../components/motion';
import type { Website } from '../../lib/types';

function SiteRow({ website }: { website: Website }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const live = website.status === 'PUBLISHED';
  const url = `${window.location.origin}/p/${website.slug}`;

  const publish = useMutation({
    mutationFn: () => websiteApi.publish(website.id),
    onSuccess: () => { toast.success(t('dashboard.publishing.publishedToast')); qc.invalidateQueries({ queryKey: ['websites'] }); },
    onError: (e) => toast.error(apiError(e).message),
  });
  const unpublish = useMutation({
    mutationFn: () => websiteApi.unpublish(website.id),
    onSuccess: () => { toast.success(t('dashboard.publishing.unpublishedToast')); qc.invalidateQueries({ queryKey: ['websites'] }); },
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
            <div className="mt-2.5 flex min-w-0 max-w-full items-center gap-2 rounded-md border border-sand-200 bg-sand-50 px-3 py-1">
              <Globe className="h-3 w-3 shrink-0 text-sand-500" />
              <code className="truncate text-[12px] text-sand-600">{url.replace(/^https?:\/\//, '')}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="flex shrink-0 items-center justify-center rounded-md p-1 text-sand-500 transition-colors hover:bg-sand-200 hover:text-sand-800 coarse:min-h-11 coarse:min-w-11"
                aria-label={t('dashboard.publishing.copySiteUrl')}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-sand-900" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/customize/${website.id}`} className="btn-primary">
              <Sparkles className="h-4 w-4" /> {t('dashboard.publishing.customize')}
            </Link>
            {live && (
              <a href={url} target="_blank" rel="noreferrer" className="btn-secondary">
                {t('dashboard.publishing.visit')} <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {live ? (
              <Button variant="secondary" onClick={() => unpublish.mutate()} loading={unpublish.isPending}>
                {t('dashboard.publishing.unpublish')}
              </Button>
            ) : (
              <Button variant="sun" onClick={() => publish.mutate()} loading={publish.isPending}>
                {t('dashboard.publishing.publish')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Publishing() {
  const { t } = useTranslation();
  const { data: websites, isLoading } = useQuery({ queryKey: ['websites'], queryFn: websiteApi.list });
  if (isLoading) return <CenteredSpinner />;

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <FadeUp>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-sand-900">
              {t('dashboard.publishing.title')}
            </h1>
            <p className="mt-1 text-sand-600">{t('dashboard.publishing.subtitle')}</p>
          </div>
          <Link to="/builder" className="btn-secondary">
            {t('common.newSite')}
          </Link>
        </div>
      </FadeUp>

      {!websites || websites.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Globe className="h-10 w-10 text-sand-300" />}
            title={t('dashboard.publishing.emptyTitle')}
            description={t('dashboard.publishing.emptyDesc')}
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
        {t('dashboard.publishing.domainsNote')}
      </p>
    </div>
  );
}
