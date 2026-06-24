import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { apiError } from '../../lib/api';
import { Button, Field, Input } from '../../components/ui';
import { AuthShell } from '../../components/AuthShell';
import { FadeUp } from '../../components/motion';

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
    <AuthShell
      points={[
        'Free to start — no card required',
        'Your own address, live in about five minutes',
        'Everything in one calm dashboard',
      ]}
    >
      <FadeUp>
        <h1 className="font-display text-[2rem] font-semibold tracking-tightest text-sand-950">Create your account</h1>
        <p className="mt-2 text-sm text-sand-500">Set up your driving school in minutes.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
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
          <Button type="submit" variant="sun" loading={loading} className="w-full">
            Create account <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-sand-500">
          Already have an account?{' '}
          <Link to="/login" className="link-underline text-sun-700">
            Sign in
          </Link>
        </p>
      </FadeUp>
    </AuthShell>
  );
}
