import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi, apiError } from '../../lib/api';
import { Button, Field, Input } from '../../components/ui';
import { AuthShell } from '../../components/AuthShell';
import { FadeUp } from '../../components/motion';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
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
        <h1 className="text-3xl font-semibold tracking-tight text-sand-900">Reset your password</h1>
        {sent ? (
          <>
            <p className="mt-2 text-sm text-sand-600">
              If an account exists for <span className="font-medium text-sand-900">{email.trim()}</span>, a reset
              link is on its way. The link works once and expires in 30 minutes.
            </p>
            <p className="mt-6 text-center text-sm text-sand-600">
              <Link to="/login" className="font-medium text-sun-600 hover:text-sun-700 hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-sand-600">
              Enter your account email and we'll send you a link to choose a new password.
            </p>
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
              <Button type="submit" variant="primary" loading={loading} className="w-full">
                Send reset link
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-sand-600">
              Remembered it?{' '}
              <Link to="/login" className="font-medium text-sun-600 hover:text-sun-700 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </FadeUp>
    </AuthShell>
  );
}
