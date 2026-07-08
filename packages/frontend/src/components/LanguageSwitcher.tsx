import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { LANGS } from '../lib/i18n';
import { cn } from '../lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const current = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];
  return (
    <label
      className={cn(
        'glass group relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sand-700 transition-colors hover:bg-white/85 focus-within:border-sun-500/70 focus-within:ring-4 focus-within:ring-sun-500/15 coarse:min-h-11',
        className
      )}
      title={t('common.language')}
    >
      <Globe className="h-4 w-4 text-sand-500" strokeWidth={2} aria-hidden />
      <select
        aria-label={t('common.language')}
        value={current.code}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent pe-5 ps-0 font-semibold text-current focus:outline-none"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-2.5 h-4 w-4 text-sand-400" strokeWidth={2} aria-hidden />
    </label>
  );
}
