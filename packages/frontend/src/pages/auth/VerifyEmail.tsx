import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { apiError, authApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { CenteredSpinner } from '../../components/ui';
import { Logo } from '../../components/Logo';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { user, updateUser } = useAuth();
  const [state, setState] = useState<'working' | 'ok' | 'fail'>('working');
  const [message, setMessage] = useState('');
  const ran = useRef(false); // the token is one-time-use — never call verify twice (StrictMode re-runs effects)

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setState('fail');
      setMessage('This verification link is missing its code.');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => {
        setState('ok');
        if (user) updateUser({ ...user, emailVerified: true });
      })
      .catch((e) => {
        setState('fail');
        setMessage(apiError(e).message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 bg-white px-6 text-center">
      <Link to="/" aria-label="Mumotor home"><Logo size="lg" /></Link>
      {state === 'working' ? (
        <CenteredSpinner label="Verifying your email…" />
      ) : state === 'ok' ? (
        <div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" strokeWidth={1.75} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-sand-900">Email verified</h1>
          <p className="mx-auto mt-3 max-w-sm text-sand-600">
            Your account email is confirmed. You're all set.
          </p>
          <Link to="/dashboard" className="btn-primary mt-6">Go to dashboard</Link>
        </div>
      ) : (
        <div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-9 w-9 text-ember-600" strokeWidth={1.75} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-sand-900">Link expired</h1>
          <p className="mx-auto mt-3 max-w-sm text-sand-600">
            {message || 'This verification link is invalid or has expired.'} You can request a fresh
            link from your dashboard.
          </p>
          <Link to="/dashboard" className="btn-primary mt-6">Go to dashboard</Link>
        </div>
      )}
    </div>
  );
}
