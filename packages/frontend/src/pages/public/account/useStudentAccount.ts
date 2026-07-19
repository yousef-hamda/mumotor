import { useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiError, studentPortalApi } from '../../../lib/api';
import { bookLocale, bookT } from '../../../lib/bookingStrings';
import { dirForLocale } from '../../../lib/templateTheme';
import type { AccountActions, AccountData } from './types';

const seenKey = (websiteId: string) => `mumotor_student_seen:${websiteId}`;

export interface AccountState {
  status: 'loading' | 'error' | 'ready';
  data: AccountData | null;
  actions: AccountActions;
  retry: () => void;
}

/**
 * The single, template-agnostic data + actions layer for the student dashboard.
 * Wraps the existing student queries with the SAME query keys (so the chat/unread
 * polls are unchanged) plus a new history query, and derives one `AccountData`.
 * Every bespoke skin consumes this — none of them touch React Query or the token.
 */
export function useStudentAccount(args: {
  websiteId: string;
  slug: string;
  classDuration: number;
  schoolName: string;
  logoSrc: string | null;
  locale?: string | null;
  onLogout: () => void;
}): AccountState {
  const { websiteId, slug, classDuration, schoolName, logoSrc, locale, onLogout } = args;
  const qc = useQueryClient();
  const L = bookLocale(locale);
  const dir = dirForLocale(locale);

  const me = useQuery({ queryKey: ['student', 'me', websiteId], queryFn: () => studentPortalApi.me(websiteId), retry: false });
  const lessons = useQuery({ queryKey: ['student', 'lessons', websiteId], queryFn: () => studentPortalApi.lessons(websiteId), retry: false });
  const history = useQuery({ queryKey: ['student', 'history', websiteId], queryFn: () => studentPortalApi.history(websiteId), retry: false });
  const messages = useQuery({ queryKey: ['student', 'messages', websiteId], queryFn: () => studentPortalApi.messages(websiteId), refetchInterval: 8000, retry: false });

  // Expired session (401) or paused enrollment (403) → sign out.
  useEffect(() => {
    const s = me.isError ? apiError(me.error).status : 0;
    if (s === 401 || s === 403) onLogout();
  }, [me.isError, me.error, onLogout]);

  const sendMut = useMutation({
    mutationFn: (body: string) => studentPortalApi.sendMessage(websiteId, body),
    onSuccess: () => messages.refetch(),
    onError: (e) => toast.error(apiError(e).message),
  });
  const saveMut = useMutation({
    mutationFn: (phone: string) => studentPortalApi.updateProfile(websiteId, { studentPhone: phone }),
    onSuccess: () => {
      toast.success(bookT(L, 'profileUpdated'));
      me.refetch();
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  const markMessagesSeen = useCallback(() => {
    const list = messages.data;
    if (list && list.length) {
      const latest = Math.max(...list.map((m) => new Date(m.createdAt).getTime()));
      try {
        localStorage.setItem(seenKey(websiteId), String(latest));
      } catch {
        /* ignore */
      }
    }
  }, [messages.data, websiteId]);

  const refetch = useCallback(() => {
    me.refetch();
    lessons.refetch();
    history.refetch();
    messages.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions: AccountActions = {
    bookHref: `/p/${slug}/book-lesson`,
    siteHref: `/p/${slug}`,
    sendMessage: (body) => sendMut.mutate(body),
    sendPending: sendMut.isPending,
    saveProfile: (phone) => saveMut.mutate(phone),
    savePending: saveMut.isPending,
    markMessagesSeen,
    logout: onLogout,
    refetch,
  };

  const meErr = me.isError ? apiError(me.error).status : 0;
  if (meErr && meErr !== 401 && meErr !== 403) return { status: 'error', data: null, actions, retry: refetch };
  if (me.isLoading || !me.data) return { status: 'loading', data: null, actions, retry: refetch };

  const upcoming = lessons.data ?? [];
  const stats = me.data.stats ?? { upcoming: upcoming.length, completed: 0, total: upcoming.length };
  const lastSeen = Number((() => { try { return localStorage.getItem(seenKey(websiteId)); } catch { return 0; } })() ?? 0);
  const unread = (messages.data ?? []).filter((m) => m.sender === 'TEACHER' && new Date(m.createdAt).getTime() > lastSeen).length;
  const denom = stats.completed + stats.upcoming;

  const data: AccountData = {
    student: { id: me.data.id, name: me.data.name, email: me.data.email, phone: me.data.phone },
    stats,
    readiness: {
      completed: stats.completed,
      upcoming: stats.upcoming,
      total: stats.total,
      hoursDriven: history.data?.hoursDriven ?? 0,
      pct: denom > 0 ? stats.completed / denom : 0,
    },
    next: upcoming[0] ?? null,
    upcoming,
    rest: upcoming.slice(1),
    history: history.data?.history ?? [],
    messages: messages.data ?? [],
    unread,
    classDuration,
    schoolName,
    logoSrc,
    slug,
    locale: L,
    dir,
  };

  return { status: 'ready', data, actions, retry: refetch };
}
