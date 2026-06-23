import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Globe, GraduationCap, CalendarCheck, Star, CheckCircle2, LogOut } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Card, CenteredSpinner, StatusBadge } from '../../components/ui';
import { Logo } from '../../components/Logo';
import { formatDate } from '../../lib/utils';

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center gap-2 text-zinc-500">{icon}<span className="text-sm">{label}</span></div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">{value}</p>
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50 text-center">
        <h1 className="text-xl font-bold">Not authorized</h1>
        <p className="text-sm text-zinc-500">This area is for platform administrators.</p>
        <Link to="/dashboard" className="btn-secondary mt-2">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="chip bg-zinc-900 text-white">Admin</span>
          </div>
          <button onClick={logout} className="btn-ghost text-sm"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Platform overview</h1>

        {stats.isLoading ? (
          <CenteredSpinner />
        ) : stats.data ? (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat icon={<Users className="h-5 w-5" />} label="Teachers" value={stats.data.users} />
            <Stat icon={<Globe className="h-5 w-5" />} label="Sites" value={stats.data.websites} />
            <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Published" value={stats.data.published} />
            <Stat icon={<GraduationCap className="h-5 w-5" />} label="Students" value={stats.data.enrollments} />
            <Stat icon={<CalendarCheck className="h-5 w-5" />} label="Bookings" value={stats.data.bookings} />
            <Stat icon={<Star className="h-5 w-5" />} label="Reviews" value={stats.data.reviews} />
          </div>
        ) : null}

        <Card className="p-0">
          <h2 className="border-b border-zinc-100 px-5 py-3.5 font-bold">Websites</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-2.5 font-semibold">Name</th><th className="px-5 py-2.5 font-semibold">Owner</th><th className="px-5 py-2.5 font-semibold">Status</th><th className="px-5 py-2.5 font-semibold">Students</th><th className="px-5 py-2.5 font-semibold">Bookings</th>
              </tr></thead>
              <tbody>
                {sites.data?.map((w) => (
                  <tr key={w.id} className="border-b border-zinc-50">
                    <td className="px-5 py-2.5 font-medium text-zinc-900">{w.name}<span className="ms-2 font-mono text-xs text-zinc-400">/{w.slug}</span></td>
                    <td className="px-5 py-2.5 text-zinc-600">{w.user.email}</td>
                    <td className="px-5 py-2.5"><StatusBadge status={w.status} /></td>
                    <td className="px-5 py-2.5">{w._count.enrollments}</td>
                    <td className="px-5 py-2.5">{w._count.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-0">
          <h2 className="border-b border-zinc-100 px-5 py-3.5 font-bold">Teachers</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-5 py-2.5 font-semibold">Name</th><th className="px-5 py-2.5 font-semibold">Email</th><th className="px-5 py-2.5 font-semibold">Role</th><th className="px-5 py-2.5 font-semibold">Sites</th><th className="px-5 py-2.5 font-semibold">Joined</th>
              </tr></thead>
              <tbody>
                {users.data?.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-50">
                    <td className="px-5 py-2.5 font-medium text-zinc-900">{u.name}</td>
                    <td className="px-5 py-2.5 text-zinc-600">{u.email}</td>
                    <td className="px-5 py-2.5"><span className="chip bg-zinc-100 text-zinc-600">{u.role}</span></td>
                    <td className="px-5 py-2.5">{u._count.websites}</td>
                    <td className="px-5 py-2.5 text-zinc-600">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
