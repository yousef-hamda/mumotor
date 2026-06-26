import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
        'A complete trilingual website, generated for you',
        'Students enroll with a code and book themselves',
        'Reminders and daily codes run automatically',
      ]}
    >
      <FadeUp>
        <h1 className="text-3xl font-semibold tracking-tight text-sand-900">Welcome back</h1>
        <p className="mt-2 text-sm text-sand-600">Sign in to manage your students, schedule and codes.</p>
        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pe-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-sand-400 transition-colors hover:text-sand-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-sand-600">
          New here?{' '}
          <Link to="/register" className="font-medium text-sun-600 hover:text-sun-700 hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-5 rounded-lg border border-sand-200 bg-sand-50 px-4 py-2.5 text-center text-xs text-sand-500">
          Demo credentials pre-filled above
        </p>
      </FadeUp>
    </AuthShell>
  );
}
