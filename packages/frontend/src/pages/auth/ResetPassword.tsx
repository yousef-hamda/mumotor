import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { authApi, apiError } from '../../lib/api';
import { Button, Field, Input } from '../../components/ui';
import { AuthShell } from '../../components/AuthShell';
import { FadeUp } from '../../components/motion';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password updated — sign in with your new password');
      navigate('/login', { replace: true });
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
        <h1 className="text-3xl font-semibold tracking-tight text-sand-900">Choose a new password</h1>
        {!token ? (
          <>
            <p className="mt-2 text-sm text-sand-600">
              This reset link is missing its token. Request a fresh one and open the link from your email.
            </p>
            <p className="mt-6 text-center text-sm text-sand-600">
              <Link to="/forgot-password" className="font-medium text-sun-600 hover:text-sun-700 hover:underline">
                Request a new link
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <Field label="New password">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            <Field label="Confirm password">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Update password
            </Button>
          </form>
        )}
      </FadeUp>
    </AuthShell>
  );
}
