import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, GraduationCap, Star, Rocket, CreditCard, Settings as SettingsIcon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';
import { Logo } from '../Logo';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { NotificationBell } from '../NotificationBell';

const nav = [
  { to: '/dashboard', labelKey: 'common.overview', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/driving-school', labelKey: 'common.drivingTeacher', icon: GraduationCap },
  { to: '/dashboard/reviews', labelKey: 'common.reviews', icon: Star },
  { to: '/dashboard/publishing', labelKey: 'common.publishing', icon: Rocket },
  { to: '/dashboard/billing', labelKey: 'common.billing', icon: CreditCard },
  { to: '/dashboard/settings', labelKey: 'common.settings', icon: SettingsIcon },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6">
        <Link to="/dashboard">
          <Logo size="md" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                'group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm transition-all',
                active
                  ? 'bg-sand-900 font-semibold text-white shadow-[0_8px_20px_-10px_rgba(34,28,21,0.6)]'
                  : 'font-medium text-sand-600 hover:bg-sand-100 hover:text-sand-900'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px]', active ? 'text-sun-400' : 'text-sand-400 group-hover:text-sand-600')} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-2xl border border-sand-200/60 bg-sand-50/80 p-3">
        <div className="mb-2.5">
          <LanguageSwitcher className="w-full justify-start" />
        </div>
        <div className="flex items-center gap-3 px-1 py-1.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-900 text-sm font-semibold text-sand-100">
            {user?.name?.charAt(0) ?? 'M'}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sand-800">{user?.name}</p>
            <p className="truncate text-xs text-sand-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-sand-600 transition-colors hover:bg-ember-50 hover:text-ember-700"
        >
          <LogOut className="h-[18px] w-[18px]" />
          {t('common.signOut')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-sand-100/50">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-e border-sand-200/70 bg-white lg:block">{SidebarContent}</aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-sand-950/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 bg-white shadow-elevated">{SidebarContent}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-sand-200/70 bg-sand-50/85 px-4 py-3 backdrop-blur-xl">
          <button onClick={() => setOpen((v) => !v)} className="rounded-xl p-2 text-sand-600 hover:bg-sand-100 lg:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="lg:hidden">
            <Logo size="sm" />
          </div>
          <div className="ms-auto">
            <NotificationBell />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
