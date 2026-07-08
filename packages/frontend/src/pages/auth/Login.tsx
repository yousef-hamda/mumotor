import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { apiError } from '../../lib/api';
import { Button, Field, Input } from '../../components/ui';
import { AuthShell } from '../../components/AuthShell';
import { FadeUp } from '../../components/motion';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  // Demo credentials are pre-filled in local dev only — never in production.
  const [email, setEmail] = useState(import.meta.env.DEV ? 'teacher@mumotor.local' : '');
  const [password, setPassword] = useState(import.meta.env.DEV ? 'password123' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t('auth.welcomeToast'));
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(apiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      points={[t('auth.point1'), t('auth.point2'), t('auth.point3')]}
    >
      <FadeUp>
        <h1 className="text-3xl font-semibold tracking-tight text-sand-900">{t('auth.loginTitle')}</h1>
        <p className="mt-2 text-sm text-sand-600">{t('auth.loginSubtitle')}</p>
        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          <Field label={t('auth.email')}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
            />
          </Field>
          <Field label={t('auth.password')}>
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
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                className="absolute inset-y-0 end-0 flex items-center px-3 text-sand-400 transition-colors hover:text-sand-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <div className="text-end">
            <Link to="/forgot-password" className="text-sm font-medium text-sun-600 hover:text-sun-700 hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <Button type="submit" variant="primary" loading={loading} className="w-full">
            {t('common.signIn')}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-sand-600">
          {t('auth.newHere')}{' '}
          <Link to="/register" className="font-medium text-sun-600 hover:text-sun-700 hover:underline">
            {t('auth.createAccountLink')}
          </Link>
        </p>
        {import.meta.env.DEV && (
          <p className="mt-5 rounded-lg border border-sand-200 bg-sand-50 px-4 py-2.5 text-center text-xs text-sand-500">
            {t('auth.demoCreds')}
          </p>
        )}
      </FadeUp>
    </AuthShell>
  );
}
