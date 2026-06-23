import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, Star, Trash2, X, Reply } from 'lucide-react';
import { apiError, reviewsApi, websiteApi } from '../../lib/api';
import { Button, Card, CenteredSpinner, EmptyState, Select, StatusBadge, Textarea } from '../../components/ui';
import { formatDate } from '../../lib/utils';
import type { Review } from '../../lib/types';

function Stars({ n }: { n: number }) {
  return <span className="text-amber-500">{'★'.repeat(n)}<span className="text-zinc-300">{'★'.repeat(5 - n)}</span></span>;
}

export default function Reviews() {
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
    onSuccess: () => { toast.success('Updated'); setReplyFor(null); invalidate(); },
    onError: (e) => toast.error(apiError(e).message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => reviewsApi.remove(id),
    onSuccess: () => { toast.success('Deleted'); invalidate(); },
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-zinc-500">Approve student reviews to show them on your site.</p>
        </div>
        {websites && websites.length > 1 && (
          <Select value={wid} onChange={(e) => setWid(e.target.value)} className="w-auto">
            {websites.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        )}
      </div>

      {isLoading ? (
        <CenteredSpinner />
      ) : !reviews || reviews.length === 0 ? (
        <Card><EmptyState icon={<Star className="h-10 w-10" />} title="No reviews yet" description="Reviews submitted on your site will appear here for approval." /></Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900">{r.studentName}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <Stars n={r.rating} />
                  <p className="mt-1 text-xs text-zinc-400">{formatDate(r.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {r.status !== 'APPROVED' && (
                    <button title="Approve" onClick={() => update.mutate({ id: r.id, data: { status: 'APPROVED' } })} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>
                  )}
                  {r.status !== 'REJECTED' && (
                    <button title="Reject" onClick={() => update.mutate({ id: r.id, data: { status: 'REJECTED' } })} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"><X className="h-4 w-4" /></button>
                  )}
                  <button title="Reply" onClick={() => { setReplyFor(r.id); setReplyText(r.reply || ''); }} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"><Reply className="h-4 w-4" /></button>
                  <button title="Delete" onClick={() => remove.mutate(r.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-3 text-zinc-700">"{r.comment}"</p>
              {r.reply && replyFor !== r.id && (
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600"><span className="font-semibold text-zinc-800">Your reply:</span> {r.reply}</div>
              )}
              {replyFor === r.id && (
                <div className="mt-3 space-y-2">
                  <Textarea rows={2} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply…" />
                  <div className="flex gap-2">
                    <Button onClick={() => update.mutate({ id: r.id, data: { reply: replyText } })} loading={update.isPending}>Save reply</Button>
                    <Button variant="secondary" onClick={() => setReplyFor(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
