import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarDays, MessageSquare, User, LogOut, ArrowRight, Send } from 'lucide-react';
import { apiError, drivingSchoolApi, studentPortalApi, studentTokenStore } from '../../lib/api';
import { TEMPLATES } from '../../templates/registry';
import { dirForLocale } from '../../lib/templateTheme';
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

export default function StudentAccount() {
  const { websiteSlug = '' } = useParams();
  const qc = useQueryClient();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['public-settings', websiteSlug],
    queryFn: () => drivingSchoolApi.getPublicSettings(websiteSlug),
    retry: false,
  });

  // Activate any stored session token for this site on first render.
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
        <Account websiteId={settings.id} slug={websiteSlug} tab={tab} setTab={setTab} onLogout={logout} />
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
  const [code, setCode] = useState('');

  const login = useMutation({
    mutationFn: () => studentPortalApi.login(websiteId, { email: email.trim(), enrollmentCode: code.trim() }),
    onSuccess: (res) => onSuccess(res.token),
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <BookCard>
      <p className="book-eyebrow">Student account</p>
      <h1 className="book-title" style={{ marginTop: '0.6rem' }}>
        Sign in to {schoolName}
      </h1>
      <p className="book-sub">Use the email you enrolled with and the code your instructor gave you.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast.error('Please enter a valid email');
          if (code.trim().length < 4) return toast.error('Enter your enrollment code');
          login.mutate();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.4rem' }}
      >
        <BookField label="Email">
          <BookInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </BookField>
        <BookField label="Enrollment code">
          <BookInput
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. DRIVE2026"
            style={{ fontFamily: 'var(--book-font-display)', letterSpacing: '0.15em' }}
            required
          />
        </BookField>
        <BookButton variant="primary" type="submit" loading={login.isPending} className="book-btn-block">
          Sign in <ArrowRight style={{ height: '1rem', width: '1rem' }} />
        </BookButton>
      </form>
      <p className="book-sub" style={{ textAlign: 'center', marginTop: '1.2rem' }}>
        Not enrolled yet?{' '}
        <Link to={`/p/${slug}/enroll`} className="book-link">
          Enroll here
        </Link>
      </p>
    </BookCard>
  );
}

function Account({
  websiteId,
  slug,
  tab,
  setTab,
  onLogout,
}: {
  websiteId: string;
  slug: string;
  tab: Tab;
  setTab: (t: Tab) => void;
  onLogout: () => void;
}) {
  const me = useQuery({
    queryKey: ['student', 'me', websiteId],
    queryFn: () => studentPortalApi.me(websiteId),
    retry: false,
  });

  // Unread messages badge (poll lightly).
  const unread = useUnreadCount(websiteId);

  // If the session is invalid/expired, drop back to login.
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

      {tab === 'lessons' && <LessonsTab websiteId={websiteId} slug={slug} classCount={me.data.classCount} />}
      {tab === 'chat' && <ChatTab websiteId={websiteId} />}
      {tab === 'profile' && <ProfileTab websiteId={websiteId} />}
    </div>
  );
}

function useUnreadCount(websiteId: string): number {
  // Cheap unread signal: count teacher messages newer than the last time the
  // student opened the chat. We piggyback on the messages list.
  const msgs = useQuery({
    queryKey: ['student', 'messages', websiteId],
    queryFn: () => studentPortalApi.messages(websiteId),
    refetchInterval: 15000,
    retry: false,
  });
  const lastSeen = Number(localStorage.getItem(`mumotor_student_seen:${websiteId}`) ?? 0);
  return (msgs.data ?? []).filter((m) => m.sender === 'TEACHER' && new Date(m.createdAt).getTime() > lastSeen).length;
}

function LessonsTab({ websiteId, slug, classCount }: { websiteId: string; slug: string; classCount: number }) {
  const lessons = useQuery({
    queryKey: ['student', 'lessons', websiteId],
    queryFn: () => studentPortalApi.lessons(websiteId),
    retry: false,
  });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const cancel = useMutation({
    mutationFn: (bookingId: string) => studentPortalApi.cancelLesson(websiteId, bookingId),
    onSuccess: () => {
      toast.success('Lesson cancelled');
      setConfirmId(null);
      lessons.refetch();
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  return (
    <BookCard>
      <div className="book-stats">
        <div className="book-stat">
          <div className="book-stat-num">{classCount}</div>
          <div className="book-stat-label">Lessons taken</div>
        </div>
        <div className="book-stat">
          <div className="book-stat-num">{lessons.data?.length ?? 0}</div>
          <div className="book-stat-label">Upcoming</div>
        </div>
        <div className="book-stat">
          <div className="book-stat-num">{classCount + (lessons.data?.length ?? 0)}</div>
          <div className="book-stat-label">Total booked</div>
        </div>
      </div>

      <h2 className="book-title" style={{ fontSize: '1.1rem', marginTop: '1.4rem' }}>
        Upcoming lessons
      </h2>

      {lessons.isLoading ? (
        <BookSpinner label="Loading…" />
      ) : !lessons.data || lessons.data.length === 0 ? (
        <div className="book-note" style={{ marginTop: '0.8rem' }}>
          You have no upcoming lessons booked.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.8rem' }}>
          {lessons.data.map((b) => (
            <div key={b.id} className="book-row">
              <div>
                <div className="book-row-date">{formatDateLong(b.date)}</div>
                <div className="book-row-time">
                  {b.time} · {b.duration} min
                </div>
              </div>
              {confirmId === b.id ? (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <BookButton variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate(b.id)}>
                    Confirm
                  </BookButton>
                  <BookButton variant="secondary" onClick={() => setConfirmId(null)}>
                    Keep
                  </BookButton>
                </div>
              ) : b.cancellable ? (
                <button className="book-link" style={{ color: '#e5484d' }} onClick={() => setConfirmId(b.id)}>
                  Cancel
                </button>
              ) : (
                <span className="book-row-time" title="Lessons can be cancelled up to 2 hours before they start">
                  Starts soon
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <Link to={`/p/${slug}/book-lesson`} className="book-btn book-btn-primary book-btn-block" style={{ marginTop: '1.2rem' }}>
        Book a lesson <ArrowRight style={{ height: '1rem', width: '1rem' }} />
      </Link>
      <p className="book-sub" style={{ textAlign: 'center', marginTop: '0.6rem' }}>
        Lessons can be cancelled up to 2 hours before they start.
      </p>
    </BookCard>
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

  // Mark as seen (clears the unread badge) whenever the thread renders/updates.
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

function ProfileTab({ websiteId }: { websiteId: string }) {
  const me = useQuery({
    queryKey: ['student', 'me', websiteId],
    queryFn: () => studentPortalApi.me(websiteId),
    retry: false,
  });
  const [phone, setPhone] = useState<string | null>(null);
  const phoneValue = phone ?? me.data?.phone ?? '';

  const save = useMutation({
    mutationFn: () => studentPortalApi.updateProfile(websiteId, { studentPhone: phoneValue.trim() }),
    onSuccess: () => {
      toast.success('Profile updated');
      me.refetch();
      setPhone(null);
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  if (me.isLoading || !me.data) return <BookSpinner label="Loading…" />;

  return (
    <BookCard>
      <h2 className="book-title" style={{ fontSize: '1.1rem' }}>
        Your details
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.2rem' }}>
        <BookField label="Name">
          <BookInput value={me.data.name} disabled />
        </BookField>
        <BookField label="Email">
          <BookInput value={me.data.email} disabled />
        </BookField>
        <BookField label="Phone" hint="The number your instructor uses to reach you.">
          <BookInput
            type="tel"
            value={phoneValue}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+972 50 123 4567"
          />
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
