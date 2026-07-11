import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 bg-white px-6 text-center">
      <Link to="/" aria-label={t('auth.mumotorHome')}><Logo size="lg" /></Link>
      <div>
        <p className="text-sm font-medium text-sand-500">{t('notFound.code')}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-sand-900 sm:text-5xl">{t('notFound.title')}</h1>
        <p className="mx-auto mt-4 max-w-sm text-lg text-sand-600 leading-relaxed">
          {t('notFound.body')}
        </p>
      </div>
      <Link to="/" className="btn-primary">
        {t('notFound.back')} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
