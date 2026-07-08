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
  const markOne = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
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
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center rounded-lg p-2 text-sand-600 transition-colors hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sun-500/50 coarse:min-h-11 coarse:min-w-11"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sun-600 px-1 text-[10px] font-bold tabular-nums text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute end-0 z-50 mt-2 w-[calc(100vw-1rem)] max-w-[20rem] overflow-hidden rounded-xl border border-sand-200 bg-white shadow-elevated" role="menu">
          <div className="flex items-center justify-between border-b border-sand-200 px-4 py-3">
            <span className="text-sm font-semibold tracking-tight text-sand-900">Notifications</span>
            {unread > 0 ? (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-xs font-medium text-sun-600 hover:underline disabled:opacity-50"
              >
                Mark all as read
              </button>
            ) : (
              <span className="text-xs tabular-nums text-sand-500">{items.length}</span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-sand-500">You're all caught up.</p>
            ) : (
              items.map((n) => {
                const Icon = ICON[n.type] ?? Info;
                const isUnread = !n.read;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => { if (isUnread) markOne.mutate(n.id); }}
                    disabled={!isUnread}
                    title={isUnread ? 'Mark as read' : undefined}
                    className={cn(
                      'flex w-full gap-3 border-b border-sand-100 px-4 py-3 text-start last:border-b-0 disabled:cursor-default',
                      isUnread && 'bg-sand-50 hover:bg-sand-100'
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sand-900" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-sand-900">{n.title}</p>
                      {n.body && <p className="truncate text-xs text-sand-600">{n.body}</p>}
                      <p className="mt-0.5 text-[11px] text-sand-500">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sun-600" aria-hidden />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
