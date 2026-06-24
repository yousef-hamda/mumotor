import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { apiError } from '../../lib/api';
import { Button, Field, Input } from '../../components/ui';
import { AuthShell } from '../../components/AuthShell';
import { FadeUp } from '../../components/motion';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const [email, setEmail] = useState('teacher@mumotor.local');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(apiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      points={[
        'Beautiful trilingual website, generated for you',
        'Students enroll with a code and book themselves',
        'Reminders and daily codes run on autopilot',
      ]}
    >
      <FadeUp>
        <h1 className="font-display text-[2rem] font-semibold tracking-tightest text-sand-950">Welcome back</h1>
        <p className="mt-2 text-sm text-sand-500">Manage your students, schedule and codes.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>
          <Button type="submit" variant="sun" loading={loading} className="w-full">
            Sign in <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-sand-500">
          New here?{' '}
          <Link to="/register" className="link-underline text-sun-700">
            Create an account
          </Link>
        </p>
        <p className="mt-5 rounded-2xl border border-sand-200/70 bg-sand-50 px-4 py-2.5 text-center text-xs text-sand-400">
          Demo credentials pre-filled above
        </p>
      </FadeUp>
    </AuthShell>
  );
}
