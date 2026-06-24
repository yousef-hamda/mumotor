import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { LANGS } from '../lib/i18n';
import { cn } from '../lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];
  return (
    <label
      className={cn(
        'relative inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-white/70 px-2.5 py-1 text-sm text-sand-600 shadow-ring backdrop-blur transition-colors hover:border-sand-300',
        className
      )}
      title="Language"
    >
      <Globe className="h-4 w-4 text-sun-500" />
      <select
        value={current.code}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent py-0.5 pe-4 ps-0.5 font-semibold text-sand-700 focus:outline-none"
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
