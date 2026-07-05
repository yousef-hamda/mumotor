import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import toast from 'react-hot-toast';
import { authApi, apiError } from '../../lib/api';
import { Button, Field, Input } from '../../components/ui';
import { AuthShell } from '../../components/AuthShell';
import { FadeUp } from '../../components/motion';

export default function ForgotPassword() {
  const { t } = useTranslation();
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
      points={[t('auth.point1'), t('auth.point2'), t('auth.point3')]}
    >
      <FadeUp>
        <h1 className="text-3xl font-semibold tracking-tight text-sand-900">{t('auth.forgotTitle')}</h1>
        {sent ? (
          <>
            <p className="mt-2 text-sm text-sand-600">
              <Trans
                i18nKey="auth.forgotSent"
                values={{ email: email.trim() }}
                components={{ e: <span className="font-medium text-sand-900" /> }}
              />
            </p>
            <p className="mt-6 text-center text-sm text-sand-600">
              <Link to="/login" className="font-medium text-sun-600 hover:text-sun-700 hover:underline">
                {t('auth.backToSignIn')}
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-sand-600">
              {t('auth.forgotSubtitle')}
            </p>
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
              <Button type="submit" variant="primary" loading={loading} className="w-full">
                {t('auth.sendResetLink')}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-sand-600">
              {t('auth.rememberedIt')}{' '}
              <Link to="/login" className="font-medium text-sun-600 hover:text-sun-700 hover:underline">
                {t('common.signIn')}
              </Link>
            </p>
          </>
        )}
      </FadeUp>
    </AuthShell>
  );
}
