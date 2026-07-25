import { resolveBookTheme } from '../../lib/templateTheme';

/** The subset of a public-settings payload needed to paint the paused screen. The
 *  SUSPENDED payload from the backend carries exactly these (no `id`/`classDuration`). */
export type PausedInfo = {
  name?: string | null;
  locale?: string | null;
  template?: string | null;
  logoSrc?: string | null;
  customization?: { theme?: Record<string, string> } | null;
};

/** Is this public-settings payload a frozen (SUSPENDED) site? */
export function isSuspended(settings: unknown): boolean {
  return Boolean((settings as { suspended?: boolean } | null | undefined)?.suspended);
}

/**
 * On-brand "temporarily paused" screen for a frozen (SUSPENDED) site. Shared by the
 * public site AND every student page (enroll/book/account/review), so a bookmarked or
 * home-screen-installed student of a paused site sees this instead of a broken form
 * posting to `/driving-school/undefined/…` with a misleading English error (#10).
 */
export function SitePausedScreen({ settings }: { settings: PausedInfo }) {
  const theme = resolveBookTheme(settings.template ?? undefined, settings.customization?.theme);
  const name = settings.name?.trim() || 'This site';
  const initial = Array.from(name)[0]?.toUpperCase() ?? 'M';
  const loc = String(settings.locale ?? 'en').toLowerCase();
  const copy = {
    he: { t: `${name} יוצא/ת להפסקה קצרה`, b: 'האתר מושהה זמנית. חזרו לבקר בקרוב.' },
    ar: { t: `${name} في استراحة قصيرة`, b: 'الموقع متوقف مؤقتاً. يُرجى العودة قريباً.' },
    en: { t: `${name} is taking a short break`, b: 'This website is temporarily paused. Please check back soon.' },
  }[loc === 'he' ? 'he' : loc === 'ar' ? 'ar' : 'en'];
  return (
    <div
      dir={loc === 'he' || loc === 'ar' ? 'rtl' : 'ltr'}
      style={{ background: theme.vars['--book-bg'], color: theme.vars['--book-ink'], fontFamily: theme.vars['--book-font'] }}
      className="flex min-h-[100svh] flex-col items-center justify-center gap-5 px-6 text-center"
    >
      <div
        style={{ background: theme.vars['--book-accent'] }}
        className="flex h-20 w-20 items-center justify-center rounded-[1.4rem] text-3xl font-bold text-white shadow-lg"
      >
        {initial}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.t}</h1>
      <p className="max-w-md text-base opacity-60">{copy.b}</p>
    </div>
  );
}
