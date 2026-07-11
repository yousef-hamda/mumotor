import { type ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { LayoutDashboard, GraduationCap, Star, MessageSquare, Rocket, CreditCard, Settings as SettingsIcon, LogOut, MailWarning, Menu, X, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { apiError, authApi } from '../../lib/api';
import { useAccount } from '../../lib/useAccount';
import { cn } from '../../lib/utils';
import { Logo } from '../Logo';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { NotificationBell } from '../NotificationBell';
import { InstallAppButton } from '../InstallAppButton';

/** Soft nudge to verify the account email — dismissible for the session, blocks nothing. */
function VerifyEmailBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('mm_verify_dismissed') === '1');
  const [sending, setSending] = useState(false);
  if (!user || user.emailVerified !== false || dismissed) return null;

  const resend = async () => {
    setSending(true);
    try {
      await authApi.resendVerification();
      toast.success(t('dashboard.layout.verifySentToast', { email: user.email }));
    } catch (e) {
      toast.error(apiError(e).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:px-6">
      <MailWarning className="h-4 w-4 shrink-0" />
      <span>{t('dashboard.layout.verifyBanner')}</span>
      <button onClick={resend} disabled={sending} className="font-semibold underline underline-offset-2 hover:opacity-80 disabled:opacity-50">
        {sending ? t('dashboard.layout.sending') : t('dashboard.layout.resendLink')}
      </button>
      <button
        onClick={() => { sessionStorage.setItem('mm_verify_dismissed', '1'); setDismissed(true); }}
        className="ms-auto rounded-md p-1 hover:bg-amber-100"
        aria-label={t('dashboard.layout.dismiss')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Slim blue banner during the free month; blocks nothing. */
function TrialBanner() {
  const { t } = useTranslation();
  const { data: account } = useAccount();
  if (!account?.onTrial) return null;
  const label = account.trialDaysLeft <= 1 ? t('dashboard.trial.bannerLastDay') : t('dashboard.trial.bannerDays', { days: account.trialDaysLeft });
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-sun-200 bg-sun-50 px-4 py-2.5 text-sm text-sun-800 sm:px-6">
      <Sparkles className="h-4 w-4 shrink-0" />
      <span className="font-medium">{label}</span>
      <Link to="/dashboard/billing" className="ms-auto font-semibold text-sun-700 underline underline-offset-2 hover:opacity-80">
        {t('dashboard.trial.subscribe')}
      </Link>
    </div>
  );
}

/** Full-panel paywall shown in place of the page content when the account is locked. */
function AccountLocked({ price }: { price: number }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sand-900 text-white">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-sand-900">{t('dashboard.trial.lockTitle')}</h2>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-sand-600">{t('dashboard.trial.lockBody')}</p>
        <Link to="/dashboard/billing" className="btn-primary mt-6 px-7 py-3 text-base">
          {t('dashboard.trial.lockCta', { price })}
        </Link>
      </div>
    </div>
  );
}

const nav = [
  { to: '/dashboard', labelKey: 'common.overview', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/driving-school', labelKey: 'common.drivingTeacher', icon: GraduationCap },
  { to: '/dashboard/reviews', labelKey: 'common.reviews', icon: Star },
  { to: '/dashboard/messages', labelKey: 'common.messages', icon: MessageSquare },
  { to: '/dashboard/publishing', labelKey: 'common.publishing', icon: Rocket },
  { to: '/dashboard/billing', labelKey: 'common.billing', icon: CreditCard },
  { to: '/dashboard/settings', labelKey: 'common.settings', icon: SettingsIcon },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const { data: account } = useAccount();
  const [open, setOpen] = useState(false);

  // When locked (free month over, unpaid) every page except Billing is gated so
  // the only path forward is to subscribe.
  const onBilling = location.pathname.startsWith('/dashboard/billing');
  const gated = Boolean(account?.locked) && !onBilling;

  // Mobile drawer: lock body scroll + close on Escape while it's open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const current = nav.find((item) => isActive(item.to, item.exact));

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-sand-200 px-6">
        <Link to="/" aria-label={t('dashboard.layout.mumotorHome')}>
          <Logo size="md" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-sand-100 font-semibold text-sand-900'
                  : 'font-medium text-sand-600 hover:bg-sand-100 hover:text-sand-900'
              )}
            >
              {active && (
                <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-sun-600" aria-hidden="true" />
              )}
              <Icon strokeWidth={1.75} className={cn('h-5 w-5 shrink-0', active ? 'text-sand-900' : 'text-sand-400 group-hover:text-sand-600')} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sand-200 p-3">
        <div className="mb-2">
          <LanguageSwitcher className="w-full justify-start" />
        </div>
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-900 text-sm font-semibold text-white">
            {user?.name?.charAt(0) ?? 'M'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sand-900">{user?.name}</p>
            <p className="truncate text-xs text-sand-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-sand-600 transition-colors hover:bg-ember-50 hover:text-ember-700"
        >
          <LogOut className="h-5 w-5" />
          {t('common.signOut')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-e border-sand-200 bg-white lg:block">{SidebarContent}</aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-sand-950/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-[min(16rem,85vw)] flex-col bg-white shadow-elevated">{SidebarContent}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-sand-200 px-4 sm:px-6">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center justify-center rounded-lg p-2 text-sand-600 hover:bg-sand-100 coarse:min-h-11 coarse:min-w-11 lg:hidden"
            aria-label={open ? t('dashboard.layout.closeMenu') : t('dashboard.layout.openMenu')}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" aria-label={t('dashboard.layout.mumotorHome')} className="lg:hidden">
            <Logo size="sm" />
          </Link>
          {current && (
            <h1 className="hidden text-sm font-semibold tracking-tight text-sand-900 lg:block">
              {t(current.labelKey)}
            </h1>
          )}
          <div className="ms-auto flex items-center gap-1.5">
            <InstallAppButton />
            <NotificationBell />
          </div>
        </header>
        <VerifyEmailBanner />
        <TrialBanner />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {gated ? <AccountLocked price={account?.websitePrice ?? 199} /> : children}
        </main>
      </div>
    </div>
  );
}
