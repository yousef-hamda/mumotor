import { type ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { LayoutDashboard, GraduationCap, Star, MessageSquare, Rocket, CreditCard, Settings as SettingsIcon, LogOut, MailWarning, Menu, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { apiError, authApi } from '../../lib/api';
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
  const [open, setOpen] = useState(false);

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
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
