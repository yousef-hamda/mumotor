import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { apiError } from '../../lib/api';
import { Button, Field, Input } from '../../components/ui';
import { AuthShell } from '../../components/AuthShell';
import { FadeUp } from '../../components/motion';

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[+\d][\d\s-]{6,18}$/.test(form.phone.trim()))
      return toast.error(t('auth.errPhone'));
    if (form.password.length < 8) return toast.error(t('auth.errPasswordLength'));
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone.trim(),
      });
      toast.success(t('auth.accountCreatedToast'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(apiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      points={[t('auth.regPoint1'), t('auth.regPoint2'), t('auth.regPoint3')]}
    >
      <FadeUp>
        <h1 className="text-3xl font-semibold tracking-tight text-sand-900">{t('auth.registerTitle')}</h1>
        <p className="mt-2 text-sm text-sand-600">{t('auth.registerSubtitle')}</p>
        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          <Field label={t('auth.fullName')}>
            <Input value={form.name} onChange={set('name')} required placeholder={t('auth.fullNamePlaceholder')} autoComplete="name" />
          </Field>
          <Field label={t('auth.email')}>
            <Input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
            />
          </Field>
          <Field label={t('auth.phone')} hint={t('auth.phoneHint')}>
            <Input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              required
              placeholder={t('auth.phonePlaceholder')}
              autoComplete="tel"
            />
          </Field>
          <Field label={t('auth.password')} hint={t('auth.passwordHint')}>
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
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-sand-400 transition-colors hover:text-sand-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Button type="submit" variant="primary" loading={loading} className="w-full">
            {t('auth.createAccount')}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-sand-600">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-sun-600 hover:text-sun-700 hover:underline">
            {t('common.signIn')}
          </Link>
        </p>
      </FadeUp>
    </AuthShell>
  );
}
