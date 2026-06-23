import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../lib/auth';
import { apiError } from '../../lib/api';
import { Button, Field, Input } from '../../components/ui';
import { Logo } from '../../components/Logo';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center">
          <Logo size="lg" />
        </Link>
        <div className="card p-8">
          <h1 className="mb-1 text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="mb-6 text-sm text-zinc-500">Set up your driving school in minutes.</p>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Full name">
              <Input value={form.name} onChange={set('name')} required placeholder="David Cohen" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
            </Field>
            <Field label="Phone (optional)">
              <Input value={form.phone} onChange={set('phone')} placeholder="+972 50 123 4567" />
            </Field>
            <Field label="Password" hint="At least 8 characters">
              <Input type="password" value={form.password} onChange={set('password')} required autoComplete="new-password" />
            </Field>
            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
