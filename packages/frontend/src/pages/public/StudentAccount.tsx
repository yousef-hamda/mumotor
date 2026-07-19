import { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { apiError, drivingSchoolApi, studentPortalApi, studentTokenStore } from '../../lib/api';
import { TEMPLATES } from '../../templates/registry';
import { dirForLocale } from '../../lib/templateTheme';
import { bookLocale, bookT, type BookLocale } from '../../lib/bookingStrings';
import { useTenantSlug } from '../../lib/tenant';
import { TemplatedShell, BookButton, BookCard, BookField, BookInput, BookSpinner } from '../../components/public/TemplatedShell';
import { AccountFrame } from './account/AccountFrame';
import { getAccountSkin } from './account/registry';
import { useStudentAccount } from './account/useStudentAccount';

export default function StudentAccount() {
  const websiteSlug = useTenantSlug();
  const qc = useQueryClient();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['public-settings', websiteSlug],
    queryFn: () => drivingSchoolApi.getPublicSettings(websiteSlug),
    retry: false,
  });

  const [token, setToken] = useState<string | null>(() => studentTokenStore.activate(websiteSlug));
  const L = bookLocale(settings?.locale);

  const slug = settings?.template && TEMPLATES.some((t) => t.slug === settings.template) ? settings.template : TEMPLATES[0].slug;

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

  // Signed OUT → the shared themed login (a single email field — not worth a
  // bespoke screen per template; the shell already adopts the template palette).
  if (!token) {
    return (
      <TemplatedShell
        slug={slug}
        theme={(settings.customization as { theme?: Record<string, string> } | undefined)?.theme}
        dir={dirForLocale(settings.locale)}
        locale={settings.locale}
        schoolName={settings.name}
        logoSrc={settings.logoSrc}
        publicSlug={websiteSlug}
      >
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
      </TemplatedShell>
    );
  }

  // Signed IN → the bespoke, on-theme dashboard for this template.
  return <Dashboard settings={settings} slug={slug} publicSlug={websiteSlug} onLogout={logout} />;
}

function Dashboard({
  settings,
  slug,
  publicSlug,
  onLogout,
}: {
  settings: { id: string; name: string; locale?: string | null; logoSrc?: string | null; classDuration: number; customization?: unknown };
  slug: string;
  publicSlug: string;
  onLogout: () => void;
}) {
  const theme = (settings.customization as { theme?: Record<string, string> } | undefined)?.theme ?? null;
  const state = useStudentAccount({
    websiteId: settings.id,
    slug: publicSlug,
    classDuration: settings.classDuration,
    schoolName: settings.name,
    logoSrc: settings.logoSrc ?? null,
    locale: settings.locale,
    onLogout,
  });
  const Skin = getAccountSkin(slug);

  return (
    <Suspense
      fallback={
        <TemplatedShell slug={slug} publicSlug={publicSlug} theme={theme} locale={settings.locale} dir={dirForLocale(settings.locale)}>
          <BookSpinner label={bookT(bookLocale(settings.locale), 'loadingAccount')} />
        </TemplatedShell>
      }
    >
      <AccountFrame slug={slug} theme={theme} schoolName={settings.name} logoSrc={settings.logoSrc ?? null} publicSlug={publicSlug} state={state} Skin={Skin} />
    </Suspense>
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
