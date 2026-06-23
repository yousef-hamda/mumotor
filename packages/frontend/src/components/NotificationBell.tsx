import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, GraduationCap, CalendarCheck, Star, Info } from 'lucide-react';
import { notificationsApi } from '../lib/api';
import { cn } from '../lib/utils';

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  ENROLLMENT: GraduationCap,
  BOOKING: CalendarCheck,
  REVIEW: Star,
  BILLING: Info,
  SYSTEM: Info,
};

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list, refetchInterval: 30_000 });
  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const unread = data?.unread ?? 0;
  const items = data?.notifications ?? [];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open && unread) markAll.mutate(); }}
        className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-elevated">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5">
            <span className="text-sm font-semibold text-zinc-800">Notifications</span>
            <span className="text-xs text-zinc-400">{items.length}</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">You're all caught up.</p>
            ) : (
              items.map((n) => {
                const Icon = ICON[n.type] ?? Info;
                return (
                  <div key={n.id} className={cn('flex gap-3 border-b border-zinc-50 px-4 py-3', !n.read && 'bg-brand-50/40')}>
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                      {n.body && <p className="truncate text-xs text-zinc-500">{n.body}</p>}
                      <p className="mt-0.5 text-[11px] text-zinc-400">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
