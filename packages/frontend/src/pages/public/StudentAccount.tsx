import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarDays, MessageSquare, User, LogOut, ArrowRight, Send, Clock } from 'lucide-react';
import { apiError, drivingSchoolApi, studentPortalApi, studentTokenStore, type StudentSummary } from '../../lib/api';
import { TEMPLATES } from '../../templates/registry';
import { dirForLocale } from '../../lib/templateTheme';
import { useTenantSlug } from '../../lib/tenant';
import { formatDateLong } from '../../lib/utils';
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

  const slug =
    settings?.template && TEMPLATES.some((t) => t.slug === settings.template) ? settings.template : TEMPLATES[0].slug;
  const shellProps = {
    slug,
    theme: (settings?.customization as { theme?: Record<string, string> } | undefined)?.theme,
    dir: dirForLocale(settings?.locale),
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
        <BookSpinner label="Loading…" />
      </TemplatedShell>
    );
  if (!settings)
    return (
      <TemplatedShell slug={slug} publicSlug={websiteSlug}>
        <BookCard>
          <h1 className="book-title">School not found</h1>
          <p className="book-sub">This link may be incorrect or no longer active.</p>
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
          onSuccess={(t) => {
            studentTokenStore.set(websiteSlug, t);
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
        />
      )}
    </TemplatedShell>
  );
}

function LoginCard({
  websiteId,
  schoolName,
  slug,
  onSuccess,
}: {
  websiteId: string;
  schoolName: string;
  slug: string;
  onSuccess: (token: string) => void;
}) {
  const [email, setEmail] = useState('');

  const login = useMutation({
    mutationFn: () => studentPortalApi.login(websiteId, { email: email.trim() }),
    onSuccess: (res) => onSuccess(res.token),
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <BookCard>
      <p className="book-eyebrow">Student account</p>
      <h1 className="book-title" style={{ marginTop: '0.6rem' }}>
        Sign in to {schoolName}
      </h1>
      <p className="book-sub">Enter the email you enrolled with — no code needed.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast.error('Please enter a valid email');
          login.mutate();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.4rem' }}
      >
        <BookField label="Email">
          <BookInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </BookField>
        <BookButton variant="primary" type="submit" loading={login.isPending} className="book-btn-block">
          Sign in <ArrowRight style={{ height: '1rem', width: '1rem' }} />
        </BookButton>
      </form>
      <p className="book-sub" style={{ textAlign: 'center', marginTop: '1.2rem' }}>
        New student?{' '}
        <Link to={`/p/${slug}/enroll`} className="book-link">
          Enroll with your code
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
}: {
  websiteId: string;
  slug: string;
  classDuration: number;
  tab: Tab;
  setTab: (t: Tab) => void;
  onLogout: () => void;
}) {
  const me = useQuery({
    queryKey: ['student', 'me', websiteId],
    queryFn: () => studentPortalApi.me(websiteId),
    retry: false,
  });

  const unread = useUnreadCount(websiteId);

  useEffect(() => {
    if (me.isError && apiError(me.error).status === 401) onLogout();
  }, [me.isError, me.error, onLogout]);

  if (me.isLoading) return <BookSpinner label="Loading your account…" />;
  if (!me.data) return <BookSpinner label="…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div>
          <p className="book-eyebrow">Welcome back</p>
          <h1 className="book-title">{me.data.name}</h1>
        </div>
        <BookButton variant="secondary" onClick={onLogout} aria-label="Sign out">
          <LogOut style={{ height: '1rem', width: '1rem' }} /> Sign out
        </BookButton>
      </div>

      <div className="book-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'lessons'} className="book-tab" onClick={() => setTab('lessons')}>
          <CalendarDays style={{ height: '1rem', width: '1rem' }} /> Lessons
        </button>
        <button role="tab" aria-selected={tab === 'chat'} className="book-tab" onClick={() => setTab('chat')}>
          <MessageSquare style={{ height: '1rem', width: '1rem' }} /> Chat
          {unread > 0 && <span className="book-tab-badge">{unread}</span>}
        </button>
        <button role="tab" aria-selected={tab === 'profile'} className="book-tab" onClick={() => setTab('profile')}>
          <User style={{ height: '1rem', width: '1rem' }} /> Profile
        </button>
      </div>

      {tab === 'lessons' && <LessonsTab websiteId={websiteId} slug={slug} classDuration={classDuration} stats={me.data.stats} />}
      {tab === 'chat' && <ChatTab websiteId={websiteId} />}
      {tab === 'profile' && <ProfileTab me={me.data} websiteId={websiteId} onSaved={() => me.refetch()} />}
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
}: {
  websiteId: string;
  slug: string;
  classDuration: number;
  stats?: StudentSummary['stats'];
}) {
  const lessons = useQuery({
    queryKey: ['student', 'lessons', websiteId],
    queryFn: () => studentPortalApi.lessons(websiteId),
    retry: false,
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const qc = useQueryClient();

  const cancel = useMutation({
    mutationFn: (bookingId: string) => studentPortalApi.cancelLesson(websiteId, bookingId),
    onSuccess: () => {
      toast.success('Lesson cancelled');
      setConfirmId(null);
      lessons.refetch();
      qc.invalidateQueries({ queryKey: ['student', 'me', websiteId] });
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  const upcoming = lessons.data ?? [];
  const next = upcoming[0];
  const rest = upcoming.slice(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Next lesson highlight */}
      {lessons.isLoading ? (
        <BookCard><BookSpinner label="Loading your lessons…" /></BookCard>
      ) : next ? (
        <div
          style={{
            background: 'var(--book-accent-soft)',
            border: '1px solid var(--book-line)',
            borderRadius: 'calc(var(--book-radius) + 6px)',
            padding: '1.4rem 1.5rem',
          }}
        >
          <p className="book-eyebrow">Your next lesson</p>
          <p style={{ margin: '0.5rem 0 0', fontFamily: 'var(--book-font-display)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--book-ink)' }}>
            {formatDateLong(next.date)}
          </p>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--book-ink)', fontWeight: 600 }}>
            {slotRange(next.time, next.duration)} · {next.duration} min
          </p>
          <p className="book-sub" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock style={{ height: '0.95rem', width: '0.95rem' }} /> Please arrive 5 minutes early.
          </p>
          <div style={{ marginTop: '1rem' }}>
            {confirmId === next.id ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <BookButton variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate(next.id)}>Cancel lesson</BookButton>
                <BookButton variant="secondary" onClick={() => setConfirmId(null)}>Keep it</BookButton>
              </div>
            ) : next.cancellable ? (
              <BookButton variant="secondary" onClick={() => setConfirmId(next.id)}>Cancel this lesson</BookButton>
            ) : (
              <span className="book-sub">Starts soon — to cancel, contact your instructor.</span>
            )}
          </div>
        </div>
      ) : (
        <BookCard>
          <div className="book-note" style={{ border: 'none', padding: '0.5rem 0' }}>
            You have no upcoming lessons. Book your next one below.
          </div>
        </BookCard>
      )}

      <BookCard>
        {/* Real, correct counts */}
        <div className="book-stats">
          <div className="book-stat">
            <div className="book-stat-num">{stats?.completed ?? 0}</div>
            <div className="book-stat-label">Completed</div>
          </div>
          <div className="book-stat">
            <div className="book-stat-num">{stats?.upcoming ?? upcoming.length}</div>
            <div className="book-stat-label">Upcoming</div>
          </div>
          <div className="book-stat">
            <div className="book-stat-num">{stats?.total ?? upcoming.length}</div>
            <div className="book-stat-label">Total lessons</div>
          </div>
        </div>

        {rest.length > 0 && (
          <>
            <h2 className="book-title" style={{ fontSize: '1.05rem', marginTop: '1.4rem' }}>
              Later lessons
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.8rem' }}>
              {rest.map((b) => (
                <div key={b.id} className="book-row">
                  <div>
                    <div className="book-row-date">{formatDateLong(b.date)}</div>
                    <div className="book-row-time">{slotRange(b.time, b.duration)} · {b.duration} min</div>
                  </div>
                  {confirmId === b.id ? (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <BookButton variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate(b.id)}>Confirm</BookButton>
                      <BookButton variant="secondary" onClick={() => setConfirmId(null)}>Keep</BookButton>
                    </div>
                  ) : b.cancellable ? (
                    <button className="book-link" style={{ color: '#e5484d' }} onClick={() => setConfirmId(b.id)}>Cancel</button>
                  ) : (
                    <span className="book-row-time">Starts soon</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <Link to={`/p/${slug}/book-lesson`} className="book-btn book-btn-primary book-btn-block" style={{ marginTop: '1.2rem' }}>
          Book a lesson <ArrowRight style={{ height: '1rem', width: '1rem' }} />
        </Link>
        <p className="book-sub" style={{ textAlign: 'center', marginTop: '0.6rem' }}>
          Each lesson is {classDuration} min. Lessons can be cancelled up to 2 hours before they start.
        </p>
      </BookCard>
    </div>
  );
}

function ChatTab({ websiteId }: { websiteId: string }) {
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
        Chat with your instructor
      </h2>
      <p className="book-sub">Ask a question, reschedule, or say hello. Replies appear here.</p>

      <div className="book-chat" ref={scrollRef} style={{ marginTop: '1rem' }}>
        {messages.isLoading ? (
          <BookSpinner label="Loading messages…" />
        ) : !messages.data || messages.data.length === 0 ? (
          <div className="book-note" style={{ border: 'none' }}>
            No messages yet. Start the conversation below.
          </div>
        ) : (
          messages.data.map((m) => (
            <div key={m.id} className={m.sender === 'STUDENT' ? 'book-bubble book-bubble-me' : 'book-bubble book-bubble-them'}>
              {m.body}
              <span className="book-bubble-time">
                {new Date(m.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
        <BookInput value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message…" maxLength={2000} />
        <BookButton variant="primary" type="submit" loading={send.isPending} aria-label="Send">
          <Send style={{ height: '1rem', width: '1rem' }} />
        </BookButton>
      </form>
    </BookCard>
  );
}

function ProfileTab({ me, websiteId, onSaved }: { me: StudentSummary; websiteId: string; onSaved: () => void }) {
  const [phone, setPhone] = useState<string | null>(null);
  const phoneValue = phone ?? me.phone ?? '';

  const save = useMutation({
    mutationFn: () => studentPortalApi.updateProfile(websiteId, { studentPhone: phoneValue.trim() }),
    onSuccess: () => {
      toast.success('Profile updated');
      onSaved();
      setPhone(null);
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <BookCard>
      <h2 className="book-title" style={{ fontSize: '1.1rem' }}>
        Your details
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.2rem' }}>
        <BookField label="Name">
          <BookInput value={me.name} disabled />
        </BookField>
        <BookField label="Email">
          <BookInput value={me.email} disabled />
        </BookField>
        <BookField label="Phone" hint="The number your instructor uses to reach you.">
          <BookInput type="tel" value={phoneValue} onChange={(e) => setPhone(e.target.value)} placeholder="+972 50 123 4567" />
        </BookField>
        <BookButton
          variant="primary"
          className="book-btn-block"
          loading={save.isPending}
          disabled={phone === null}
          onClick={() => {
            if (phoneValue && !/^[+\d][\d\s-]{6,18}$/.test(phoneValue.trim())) return toast.error('Please enter a valid phone number');
            save.mutate();
          }}
        >
          Save changes
        </BookButton>
      </div>
    </BookCard>
  );
}
