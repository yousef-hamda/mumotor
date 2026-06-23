import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, GraduationCap, Star, Rocket, CreditCard, Settings as SettingsIcon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';
import { Logo } from '../Logo';
import { LanguageSwitcher } from '../LanguageSwitcher';

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
      <div className="px-6 py-5">
        <Link to="/dashboard">
          <Logo size="md" />
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active ? 'bg-zinc-100 font-semibold text-zinc-900' : 'font-medium text-zinc-600 hover:bg-zinc-50'
              )}
            >
              <Icon className={cn('h-[18px] w-[18px]', active ? 'text-zinc-900' : 'text-zinc-400')} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-100 p-3">
        <div className="mb-1 px-3 py-1">
          <LanguageSwitcher />
        </div>
        <div className="mb-1 px-3 py-2">
          <p className="truncate text-sm font-semibold text-zinc-800">{user?.name}</p>
          <p className="truncate text-xs text-zinc-500">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          <LogOut className="h-[18px] w-[18px] text-zinc-400" />
          {t('common.signOut')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white lg:block">{SidebarContent}</aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-zinc-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-elevated">{SidebarContent}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 hover:bg-zinc-100">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Logo size="sm" />
          <div className="w-9" />
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
