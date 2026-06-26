import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { apiError } from '../../lib/api';
import { Button, Field, Input } from '../../components/ui';
import { AuthShell } from '../../components/AuthShell';
import { FadeUp } from '../../components/motion';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      toast.success('Account created!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(apiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      points={[
        'Free to start — no card required',
        'Your own web address, live in minutes',
        'Manage everything from one dashboard',
      ]}
    >
      <FadeUp>
        <h1 className="text-3xl font-semibold tracking-tight text-sand-900">Create your account</h1>
        <p className="mt-2 text-sm text-sand-600">Set up your driving school in a few minutes.</p>
        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          <Field label="Full name">
            <Input value={form.name} onChange={set('name')} required placeholder="David Cohen" autoComplete="name" />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Phone" hint="Optional">
            <Input value={form.phone} onChange={set('phone')} placeholder="+972 50 123 4567" autoComplete="tel" />
          </Field>
          <Field label="Password" hint="At least 8 characters">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                required
                autoComplete="new-password"
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
            Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-sand-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-sun-600 hover:text-sun-700 hover:underline">
            Sign in
          </Link>
        </p>
      </FadeUp>
    </AuthShell>
  );
}
