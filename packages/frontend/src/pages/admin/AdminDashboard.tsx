import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Globe, GraduationCap, CalendarCheck, Star, CheckCircle2, LogOut } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Card, CenteredSpinner, StatusBadge } from '../../components/ui';
import { Logo } from '../../components/Logo';
import { formatDate } from '../../lib/utils';
import { FadeUp, Stagger } from '../../components/motion';

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 text-sand-500">
        <span className="text-sun-600">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-sand-900">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats, enabled: isAdmin });
  const users = useQuery({ queryKey: ['admin-users'], queryFn: adminApi.users, enabled: isAdmin });
  const sites = useQuery({ queryKey: ['admin-websites'], queryFn: adminApi.websites, enabled: isAdmin });

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-sand-50 text-center">
        <h1 className="text-xl font-semibold text-sand-900">Not authorized</h1>
        <p className="text-sm text-sand-600">This area is for platform administrators.</p>
        <Link to="/dashboard" className="btn-secondary mt-2">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/50 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="chip bg-sand-900 text-white">Admin</span>
          </div>
          <button
            onClick={logout}
            className="btn-ghost text-sm"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        <FadeUp>
          <div>
            <p className="section-eyebrow">Platform</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-sand-900">
              Platform overview
            </h1>
          </div>
        </FadeUp>

        {/* Stats grid */}
        {stats.isLoading ? (
          <CenteredSpinner />
        ) : stats.data ? (
          <Stagger className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6" gap={0.05}>
            <Stagger.Item>
              <Stat icon={<Users className="h-4 w-4" />} label="Teachers" value={stats.data.users} />
            </Stagger.Item>
            <Stagger.Item>
              <Stat icon={<Globe className="h-4 w-4" />} label="Sites" value={stats.data.websites} />
            </Stagger.Item>
            <Stagger.Item>
              <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Published" value={stats.data.published} />
            </Stagger.Item>
            <Stagger.Item>
              <Stat icon={<GraduationCap className="h-4 w-4" />} label="Students" value={stats.data.enrollments} />
            </Stagger.Item>
            <Stagger.Item>
              <Stat icon={<CalendarCheck className="h-4 w-4" />} label="Bookings" value={stats.data.bookings} />
            </Stagger.Item>
            <Stagger.Item>
              <Stat icon={<Star className="h-4 w-4" />} label="Reviews" value={stats.data.reviews} />
            </Stagger.Item>
          </Stagger>
        ) : null}

        {/* Websites table */}
        <FadeUp>
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
              <h2 className="font-semibold tracking-tight text-sand-900">Websites</h2>
              <span className="chip bg-sand-100 text-sand-600">
                {sites.data?.length ?? 0} total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-200 text-start text-xs uppercase tracking-widest text-sand-500">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Owner</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Students</th>
                    <th className="px-5 py-3 font-semibold">Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {sites.data?.map((w) => (
                    <tr
                      key={w.id}
                      className="border-b border-sand-100 transition-colors last:border-0 hover:bg-sand-50"
                    >
                      <td className="px-5 py-3 font-medium text-sand-900">
                        {w.name}
                        <span className="ms-2 font-mono text-xs text-sand-500">/{w.slug}</span>
                      </td>
                      <td className="px-5 py-3 text-sand-600">{w.user.email}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={w.status} />
                      </td>
                      <td className="px-5 py-3 tabular-nums text-sand-700">{w._count.enrollments}</td>
                      <td className="px-5 py-3 tabular-nums text-sand-700">{w._count.bookings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </FadeUp>

        {/* Teachers table */}
        <FadeUp delay={0.06}>
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
              <h2 className="font-semibold tracking-tight text-sand-900">Teachers</h2>
              <span className="chip bg-sand-100 text-sand-600">
                {users.data?.length ?? 0} total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-200 text-start text-xs uppercase tracking-widest text-sand-500">
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Sites</th>
                    <th className="px-5 py-3 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data?.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-sand-100 transition-colors last:border-0 hover:bg-sand-50"
                    >
                      <td className="px-5 py-3 font-medium text-sand-900">{u.name}</td>
                      <td className="px-5 py-3 text-sand-600">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className="chip bg-sand-100 text-sand-700">{u.role}</span>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-sand-700">{u._count.websites}</td>
                      <td className="px-5 py-3 tabular-nums text-sand-500">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </FadeUp>
      </main>
    </div>
  );
}
