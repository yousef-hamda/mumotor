import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, Star, Trash2, X, Reply, MessageSquare } from 'lucide-react';
import { apiError, reviewsApi, websiteApi } from '../../lib/api';
import { Button, Card, CenteredSpinner, EmptyState, Select, StatusBadge, Textarea } from '../../components/ui';
import { FadeUp, Stagger } from '../../components/motion';
import { formatDate } from '../../lib/utils';
import type { Review } from '../../lib/types';

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < n ? 'fill-sand-900 text-sand-900' : 'fill-sand-200 text-sand-200'}`}
        />
      ))}
    </span>
  );
}

export default function Reviews() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: websites } = useQuery({ queryKey: ['websites'], queryFn: websiteApi.list });
  const [wid, setWid] = useState('');
  useEffect(() => { if (websites?.length && !wid) setWid(websites[0].id); }, [websites, wid]);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', wid],
    queryFn: () => reviewsApi.list(wid),
    enabled: !!wid,
  });
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['reviews', wid] });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: Review['status']; reply?: string } }) => reviewsApi.update(id, data),
    onSuccess: () => { toast.success(t('dashboard.reviews.updatedToast')); setReplyFor(null); invalidate(); },
    onError: (e) => toast.error(apiError(e).message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => reviewsApi.remove(id),
    onSuccess: () => { toast.success(t('dashboard.reviews.deletedToast')); invalidate(); },
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <FadeUp>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-sand-900">
              {t('dashboard.reviews.title')}
            </h1>
            <p className="mt-1 text-sand-600">{t('dashboard.reviews.subtitle')}</p>
          </div>
          {websites && websites.length > 1 && (
            <Select value={wid} onChange={(e) => setWid(e.target.value)} className="w-auto">
              {websites.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          )}
        </div>
      </FadeUp>

      {isLoading ? (
        <CenteredSpinner />
      ) : !reviews || reviews.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Star className="h-10 w-10 text-sand-300" />}
            title={t('dashboard.reviews.emptyTitle')}
            description={t('dashboard.reviews.emptyDesc')}
          />
        </Card>
      ) : (
        <Stagger className="space-y-4">
          {reviews.map((r) => (
            <Stagger.Item key={r.id}>
              <div className="card rounded-xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold tracking-tight text-sand-900">{r.studentName}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2.5">
                      <Stars n={r.rating} />
                      <span className="text-xs text-sand-500">{formatDate(r.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {r.status !== 'APPROVED' && (
                      <button
                        aria-label={t('dashboard.reviews.approve')}
                        onClick={() => update.mutate({ id: r.id, data: { status: 'APPROVED' } })}
                        className="flex items-center justify-center rounded-lg p-2 text-sand-900 transition-colors hover:bg-sand-100 coarse:min-h-11 coarse:min-w-11"
                      >
                        <Check strokeWidth={1.75} className="h-4 w-4" />
                      </button>
                    )}
                    {r.status !== 'REJECTED' && (
                      <button
                        aria-label={t('dashboard.reviews.reject')}
                        onClick={() => update.mutate({ id: r.id, data: { status: 'REJECTED' } })}
                        className="flex items-center justify-center rounded-lg p-2 text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-800 coarse:min-h-11 coarse:min-w-11"
                      >
                        <X strokeWidth={1.75} className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      aria-label={t('dashboard.reviews.reply')}
                      onClick={() => { setReplyFor(r.id); setReplyText(r.reply || ''); }}
                      className="rounded-lg p-2 text-sand-500 transition-colors hover:bg-sand-100 hover:text-sand-800"
                    >
                      <Reply strokeWidth={1.75} className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={t('dashboard.reviews.delete')}
                      disabled={remove.isPending}
                      onClick={() => { if (window.confirm(t('dashboard.reviews.deleteConfirm'))) remove.mutate(r.id); }}
                      className="flex items-center justify-center rounded-lg p-2 text-ember-600 transition-colors hover:bg-ember-50 disabled:opacity-40 coarse:min-h-11 coarse:min-w-11"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-4 border-s-2 border-sand-200 ps-3.5 text-[15px] leading-relaxed text-sand-700">{r.comment}</p>

                {r.reply && replyFor !== r.id && (
                  <div className="mt-3.5 rounded-lg border border-sand-200 bg-sand-50 p-3.5 text-sm text-sand-600">
                    <span className="font-semibold text-sand-800">{t('dashboard.reviews.yourReply')}</span>
                    {r.reply}
                  </div>
                )}

                {replyFor === r.id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={t('dashboard.reviews.replyPlaceholder')}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => update.mutate({ id: r.id, data: { reply: replyText } })}
                        loading={update.isPending}
                      >
                        {t('dashboard.reviews.saveReply')}
                      </Button>
                      <Button variant="secondary" onClick={() => setReplyFor(null)}>{t('dashboard.reviews.cancel')}</Button>
                    </div>
                  </div>
                )}
              </div>
            </Stagger.Item>
          ))}
        </Stagger>
      )}
    </div>
  );
}
