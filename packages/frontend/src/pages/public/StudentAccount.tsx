import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarDays, MessageSquare, User, LogOut, ArrowRight, Send, Clock } from 'lucide-react';
import { apiError, drivingSchoolApi, studentPortalApi, studentTokenStore, type StudentSummary } from '../../lib/api';
import { TEMPLATES } from '../../templates/registry';
import { dirForLocale } from '../../lib/templateTheme';
import { bookLocale, bookT, type BookLocale } from '../../lib/bookingStrings';
import { useTenantSlug } from '../../lib/tenant';
import { formatDateLongIn } from '../../lib/utils';
import {
  TemplatedShell,
  BookButton,
  BookCard,
  BookField,
  BookInput,
  BookSpinner,
} from '../../components/public/TemplatedShell';

type Tab = 'lessons' | 'chat' | 'profile';

/** "08:00" + 45 → "08:00 – 08:45". */
function slotRange(start: string, dur: number): string {
  const [h, m] = start.split(':').map(Number);
  const t = (h || 0) * 60 + (m || 0) + dur;
  const end = `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  return `${start} – ${end}`;
}

export default function StudentAccount() {
  const websiteSlug = useTenantSlug();
  const qc = useQueryClient();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['public-settings', websiteSlug],
    queryFn: () => drivingSchoolApi.getPublicSettings(websiteSlug),
    retry: false,
  });

  const [token, setToken] = useState<string | null>(() => studentTokenStore.activate(websiteSlug));
  const [tab, setTab] = useState<Tab>('lessons');

  const L = bookLocale(settings?.locale);

  const slug =
    settings?.template && TEMPLATES.some((t) => t.slug === settings.template) ? settings.template : TEMPLATES[0].slug;
  const shellProps = {
    slug,
    theme: (settings?.customization as { theme?: Record<string, string> } | undefined)?.theme,
    dir: dirForLocale(settings?.locale),
    locale: settings?.locale,
    schoolName: settings?.name,
    logoSrc: settings?.logoSrc,
    publicSlug: websiteSlug,
  };

  const logout = () => {
    studentTokenStore.clear(websiteSlug);
    setToken(null);
    qc.removeQueries({ queryKey: ['student'] });
  };

  if (settingsLoading)
    return (
      <TemplatedShell slug={slug} publicSlug={websiteSlug}>
        <BookSpinner label={bookT(L, 'loading')} />
      </TemplatedShell>
    );
  if (!settings)
    return (
      <TemplatedShell slug={slug} publicSlug={websiteSlug}>
        <BookCard>
          <h1 className="book-title">{bookT(L, 'schoolNotFound')}</h1>
          <p className="book-sub">{bookT(L, 'notFoundAccount')}</p>
        </BookCard>
      </TemplatedShell>
    );

  return (
    <TemplatedShell {...shellProps}>
      {!token ? (
        <LoginCard
          websiteId={settings.id}
          schoolName={settings.name}
          slug={websiteSlug}
          L={L}
          onSuccess={(t, info) => {
            studentTokenStore.set(websiteSlug, t, info);
            setToken(t);
          }}
        />
      ) : (
        <Account
          websiteId={settings.id}
          slug={websiteSlug}
          classDuration={settings.classDuration}
          tab={tab}
          setTab={setTab}
          onLogout={logout}
          L={L}
        />
      )}
    </TemplatedShell>
  );
}

function LoginCard({
  websiteId,
  schoolName,
  slug,
  L,
  onSuccess,
}: {
  websiteId: string;
  schoolName: string;
  slug: string;
  L: BookLocale;
  onSuccess: (token: string, info: { email: string; name: string }) => void;
}) {
  const [email, setEmail] = useState('');

  const login = useMutation({
    mutationFn: () => studentPortalApi.login(websiteId, { email: email.trim() }),
    onSuccess: (res) => onSuccess(res.token, { email: res.student.email, name: res.student.name }),
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <BookCard>
      <p className="book-eyebrow">{bookT(L, 'studentAccount')}</p>
      <h1 className="book-title" style={{ marginTop: '0.6rem' }}>
        {bookT(L, 'signInTo', { name: schoolName })}
      </h1>
      <p className="book-sub">{bookT(L, 'signInHelper')}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast.error(bookT(L, 'errEmail'));
          login.mutate();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.4rem' }}
      >
        <BookField label={bookT(L, 'emailLabel')}>
          <BookInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={bookT(L, 'phEmailYou')} required />
        </BookField>
        <BookButton variant="primary" type="submit" loading={login.isPending} className="book-btn-block">
          {bookT(L, 'signIn')} <ArrowRight className="book-arrow" style={{ height: '1rem', width: '1rem' }} />
        </BookButton>
      </form>
      <p className="book-sub" style={{ textAlign: 'center', marginTop: '1.2rem' }}>
        {bookT(L, 'newStudent')}{' '}
        <Link to={`/p/${slug}/enroll`} className="book-link">
          {bookT(L, 'enrollWithCode')}
        </Link>
      </p>
    </BookCard>
  );
}

function Account({
  websiteId,
  slug,
  classDuration,
  tab,
  setTab,
  onLogout,
  L,
}: {
  websiteId: string;
  slug: string;
  classDuration: number;
  tab: Tab;
  setTab: (t: Tab) => void;
  onLogout: () => void;
  L: BookLocale;
}) {
  const me = useQuery({
    queryKey: ['student', 'me', websiteId],
    queryFn: () => studentPortalApi.me(websiteId),
    retry: false,
  });

  const unread = useUnreadCount(websiteId);

  useEffect(() => {
    // 401 (expired session) or 403 (enrollment paused → session revoked) → sign out.
    const status = me.isError ? apiError(me.error).status : 0;
    if (status === 401 || status === 403) onLogout();
  }, [me.isError, me.error, onLogout]);

  if (me.isLoading) return <BookSpinner label={bookT(L, 'loadingAccount')} />;
  // Any other error (500 / network / rate-limit) shows a retry instead of an
  // infinite spinner the student can't escape (M21).
  if (me.isError) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <p className="book-muted" style={{ marginBottom: '1rem' }}>{bookT(L, 'accountLoadError')}</p>
        <BookButton variant="primary" onClick={() => me.refetch()}>{bookT(L, 'retry')}</BookButton>
      </div>
    );
  }
  if (!me.data) return <BookSpinner label={bookT(L, 'loadingAccount')} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ minWidth: 0 }}>
          <p className="book-eyebrow">{bookT(L, 'welcomeBackEyebrow')}</p>
          <h1 className="book-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me.data.name}</h1>
        </div>
        <BookButton variant="secondary" onClick={onLogout} aria-label={bookT(L, 'signOut')} style={{ flexShrink: 0 }}>
          <LogOut style={{ height: '1rem', width: '1rem' }} /> {bookT(L, 'signOut')}
        </BookButton>
      </div>

      <div className="book-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'lessons'} className="book-tab" onClick={() => setTab('lessons')}>
          <CalendarDays style={{ height: '1rem', width: '1rem', flexShrink: 0 }} /> <span className="book-tab-label">{bookT(L, 'tabLessons')}</span>
        </button>
        <button role="tab" aria-selected={tab === 'chat'} className="book-tab" onClick={() => setTab('chat')}>
          <MessageSquare style={{ height: '1rem', width: '1rem', flexShrink: 0 }} /> <span className="book-tab-label">{bookT(L, 'tabChat')}</span>
          {unread > 0 && <span className="book-tab-badge">{unread}</span>}
        </button>
        <button role="tab" aria-selected={tab === 'profile'} className="book-tab" onClick={() => setTab('profile')}>
          <User style={{ height: '1rem', width: '1rem', flexShrink: 0 }} /> <span className="book-tab-label">{bookT(L, 'tabProfile')}</span>
        </button>
      </div>

      {tab === 'lessons' && <LessonsTab websiteId={websiteId} slug={slug} classDuration={classDuration} stats={me.data.stats} L={L} />}
      {tab === 'chat' && <ChatTab websiteId={websiteId} L={L} />}
      {tab === 'profile' && <ProfileTab me={me.data} websiteId={websiteId} onSaved={() => me.refetch()} L={L} />}
    </div>
  );
}

function useUnreadCount(websiteId: string): number {
  const msgs = useQuery({
    queryKey: ['student', 'messages', websiteId],
    queryFn: () => studentPortalApi.messages(websiteId),
    refetchInterval: 15000,
    retry: false,
  });
  const lastSeen = Number(localStorage.getItem(`mumotor_student_seen:${websiteId}`) ?? 0);
  return (msgs.data ?? []).filter((m) => m.sender === 'TEACHER' && new Date(m.createdAt).getTime() > lastSeen).length;
}

function LessonsTab({
  websiteId,
  slug,
  classDuration,
  stats,
  L,
}: {
  websiteId: string;
  slug: string;
  classDuration: number;
  stats?: StudentSummary['stats'];
  L: BookLocale;
}) {
  const lessons = useQuery({
    queryKey: ['student', 'lessons', websiteId],
    queryFn: () => studentPortalApi.lessons(websiteId),
    retry: false,
  });

  const upcoming = lessons.data ?? [];
  const next = upcoming[0];
  const rest = upcoming.slice(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Next lesson highlight */}
      {lessons.isLoading ? (
        <BookCard><BookSpinner label={bookT(L, 'loadingLessons')} /></BookCard>
      ) : next ? (
        <div
          style={{
            background: 'var(--book-accent-soft)',
            border: '1px solid var(--book-line)',
            borderRadius: 'calc(var(--book-radius) + 6px)',
            padding: '1.4rem 1.5rem',
          }}
        >
          <p className="book-eyebrow">{bookT(L, 'yourNextLesson')}</p>
          <p style={{ margin: '0.5rem 0 0', fontFamily: 'var(--book-font-display)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--book-ink)' }}>
            {formatDateLongIn(next.date, L)}
          </p>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--book-ink)', fontWeight: 600 }}>
            {slotRange(next.time, next.duration)} · {next.duration} {bookT(L, 'minShort')}
          </p>
          <p className="book-sub" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock style={{ height: '0.95rem', width: '0.95rem' }} /> {bookT(L, 'arriveEarly')}
          </p>
          <p className="book-sub" style={{ marginTop: '0.75rem' }}>
            {bookT(L, 'contactToCancel')}
          </p>
        </div>
      ) : (
        <BookCard>
          <div className="book-note" style={{ border: 'none', padding: '0.5rem 0' }}>
            {bookT(L, 'noUpcoming')}
          </div>
        </BookCard>
      )}

      <BookCard>
        {/* Real, correct counts */}
        <div className="book-stats">
          <div className="book-stat">
            <div className="book-stat-num">{stats?.completed ?? 0}</div>
            <div className="book-stat-label">{bookT(L, 'statCompleted')}</div>
          </div>
          <div className="book-stat">
            <div className="book-stat-num">{stats?.upcoming ?? upcoming.length}</div>
            <div className="book-stat-label">{bookT(L, 'statUpcoming')}</div>
          </div>
          <div className="book-stat">
            <div className="book-stat-num">{stats?.total ?? upcoming.length}</div>
            <div className="book-stat-label">{bookT(L, 'statTotal')}</div>
          </div>
        </div>

        {rest.length > 0 && (
          <>
            <h2 className="book-title" style={{ fontSize: '1.05rem', marginTop: '1.4rem' }}>
              {bookT(L, 'laterLessons')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.8rem' }}>
              {rest.map((b) => (
                <div key={b.id} className="book-row">
                  <div>
                    <div className="book-row-date">{formatDateLongIn(b.date, L)}</div>
                    <div className="book-row-time">{slotRange(b.time, b.duration)} · {b.duration} {bookT(L, 'minShort')}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Link to={`/p/${slug}/book-lesson`} className="book-btn book-btn-primary book-btn-block" style={{ marginTop: '1.2rem' }}>
          {bookT(L, 'bookLesson')} <ArrowRight className="book-arrow" style={{ height: '1rem', width: '1rem' }} />
        </Link>
        <p className="book-sub" style={{ textAlign: 'center', marginTop: '0.6rem' }}>
          {bookT(L, 'eachLessonMin', { duration: classDuration })} {bookT(L, 'contactToCancel')}
        </p>
      </BookCard>
    </div>
  );
}

function ChatTab({ websiteId, L }: { websiteId: string; L: BookLocale }) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useQuery({
    queryKey: ['student', 'messages', websiteId],
    queryFn: () => studentPortalApi.messages(websiteId),
    refetchInterval: 8000,
    retry: false,
  });

  const send = useMutation({
    mutationFn: (body: string) => studentPortalApi.sendMessage(websiteId, body),
    onSuccess: () => {
      setDraft('');
      messages.refetch();
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  useEffect(() => {
    if (messages.data && messages.data.length) {
      const latest = Math.max(...messages.data.map((m) => new Date(m.createdAt).getTime()));
      localStorage.setItem(`mumotor_student_seen:${websiteId}`, String(latest));
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.data, websiteId]);

  return (
    <BookCard>
      <h2 className="book-title" style={{ fontSize: '1.1rem' }}>
        {bookT(L, 'chatHeading')}
      </h2>
      <p className="book-sub">{bookT(L, 'chatHelper')}</p>

      <div className="book-chat" ref={scrollRef} style={{ marginTop: '1rem' }}>
        {messages.isLoading ? (
          <BookSpinner label={bookT(L, 'loadingMessages')} />
        ) : !messages.data || messages.data.length === 0 ? (
          <div className="book-note" style={{ border: 'none' }}>
            {bookT(L, 'chatEmpty')}
          </div>
        ) : (
          messages.data.map((m) => (
            <div key={m.id} className={m.sender === 'STUDENT' ? 'book-bubble book-bubble-me' : 'book-bubble book-bubble-them'}>
              {m.body}
              <span className="book-bubble-time">
                {new Date(m.createdAt).toLocaleString(L === 'he' ? 'he' : L === 'ar' ? 'ar' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', calendar: 'gregory', numberingSystem: 'latn' })}
              </span>
            </div>
          ))
        )}
      </div>

      <form
        className="book-chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (!body) return;
          send.mutate(body);
        }}
      >
        <BookInput value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={bookT(L, 'phMessage')} maxLength={2000} />
        <BookButton variant="primary" type="submit" loading={send.isPending} aria-label={bookT(L, 'send')}>
          <Send style={{ height: '1rem', width: '1rem' }} />
        </BookButton>
      </form>
    </BookCard>
  );
}

function ProfileTab({ me, websiteId, onSaved, L }: { me: StudentSummary; websiteId: string; onSaved: () => void; L: BookLocale }) {
  const [phone, setPhone] = useState<string | null>(null);
  const phoneValue = phone ?? me.phone ?? '';

  const save = useMutation({
    mutationFn: () => studentPortalApi.updateProfile(websiteId, { studentPhone: phoneValue.trim() }),
    onSuccess: () => {
      toast.success(bookT(L, 'profileUpdated'));
      onSaved();
      setPhone(null);
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <BookCard>
      <h2 className="book-title" style={{ fontSize: '1.1rem' }}>
        {bookT(L, 'yourDetails')}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.2rem' }}>
        <BookField label={bookT(L, 'nameLabel')}>
          <BookInput value={me.name} disabled />
        </BookField>
        <BookField label={bookT(L, 'emailLabel')}>
          <BookInput value={me.email} disabled />
        </BookField>
        <BookField label={bookT(L, 'phoneLabel')} hint={bookT(L, 'phoneHint')}>
          <BookInput type="tel" value={phoneValue} onChange={(e) => setPhone(e.target.value)} placeholder={bookT(L, 'phPhone')} />
        </BookField>
        <BookButton
          variant="primary"
          className="book-btn-block"
          loading={save.isPending}
          disabled={phone === null}
          onClick={() => {
            if (!/^[+\d][\d\s-]{6,18}$/.test(phoneValue.trim())) return toast.error(bookT(L, 'errPhone'));
            save.mutate();
          }}
        >
          {bookT(L, 'saveChanges')}
        </BookButton>
      </div>
    </BookCard>
  );
}
