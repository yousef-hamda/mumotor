import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { LANGS } from '../lib/i18n';
import { cn } from '../lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];
  return (
    <label className={cn('relative inline-flex items-center gap-1.5 text-sm text-zinc-600', className)} title="Language">
      <Globe className="h-4 w-4 text-zinc-400" />
      <select
        value={current.code}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="cursor-pointer appearance-none rounded-md bg-transparent py-1 pe-5 ps-1 font-medium text-zinc-700 focus:outline-none"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
