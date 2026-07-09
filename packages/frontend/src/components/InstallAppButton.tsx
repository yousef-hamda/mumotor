import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Share, X } from 'lucide-react';
import { usePwaInstall } from '../lib/pwa';
import { bookT, type BookLocale } from '../lib/bookingStrings';
import { cn } from '../lib/utils';

/**
 * Install / Add-to-Home-Screen affordances for the installable PWA.
 *
 * `InstallAppButton` — Mumotor app chrome (dashboard header / landing). i18n via
 *   react-i18next. `SiteInstallPill` — a floating pill on a published teacher
 *   site, themed with the site's `--book-*` vars and localized to the SITE locale.
 *
 * Both hide entirely when already installed (standalone) or when neither a native
 * prompt (Android/desktop) nor iOS is available — so nothing shows where it can't work.
 */

export function InstallAppButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { canInstall, isIOS, isStandalone, promptInstall } = usePwaInstall();
  const [showHint, setShowHint] = useState(false);

  if (isStandalone || (!canInstall && !isIOS)) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (canInstall ? void promptInstall() : setShowHint((v) => !v))}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-white px-3 py-1.5 text-sm font-medium text-sand-800 transition hover:bg-sand-50 coarse:min-h-11',
          className
        )}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">{t('pwa.install')}</span>
      </button>

      {isIOS && showHint && (
        <div className="absolute end-0 z-50 mt-2 w-64 rounded-2xl border border-sand-200 bg-white p-3 text-sm text-sand-700 shadow-xl">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold text-sand-900">{t('pwa.title')}</span>
            <button aria-label={t('common.close')} onClick={() => setShowHint(false)} className="rounded p-0.5 hover:bg-sand-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="inline-flex items-center gap-1.5">
            <Share className="h-4 w-4 shrink-0 text-sun-500" />
            {t('pwa.iosHint')}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Floating "Install app" pill for a published teacher site. Themed with the
 * live `--book-*` CSS vars, safe-area aware, dismissible (per slug), localized
 * to the site locale. `slug` scopes the dismissal so each site is independent.
 */
export function SiteInstallPill({ slug, locale }: { slug: string; locale: BookLocale }) {
  const { canInstall, isIOS, isStandalone, promptInstall } = usePwaInstall();
  const storeKey = `mm_pwa_pill_dismissed_${slug}`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(storeKey) === '1';
    } catch {
      return false;
    }
  });
  const [showHint, setShowHint] = useState(false);

  if (isStandalone || dismissed || (!canInstall && !isIOS)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(storeKey, '1');
    } catch {
      /* private mode — just hide for the session */
    }
    setDismissed(true);
  };

  return (
    <div
      className="book-install-pill"
      style={{
        position: 'fixed',
        insetInlineStart: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 8px 8px 14px',
        borderRadius: '999px',
        background: 'var(--book-accent, #0071E3)',
        color: 'var(--book-accent-ink, #fff)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <button
        type="button"
        onClick={() => (canInstall ? void promptInstall() : setShowHint((v) => !v))}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          color: 'inherit',
          font: 'inherit',
          fontWeight: 600,
          fontSize: '14px',
          border: 0,
          cursor: 'pointer',
          minHeight: '28px',
        }}
      >
        <Download style={{ width: 18, height: 18 }} />
        {bookT(locale, 'installApp')}
      </button>
      <button
        type="button"
        aria-label="×"
        onClick={dismiss}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.18)',
          color: 'inherit',
          border: 0,
          cursor: 'pointer',
        }}
      >
        <X style={{ width: 16, height: 16 }} />
      </button>

      {isIOS && showHint && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            insetInlineStart: '50%',
            transform: 'translateX(-50%)',
            width: 'min(280px, calc(100vw - 32px))',
            padding: '10px 12px',
            borderRadius: '14px',
            background: 'var(--book-surface, #fff)',
            color: 'var(--book-ink, #111)',
            border: '1px solid var(--book-line, rgba(0,0,0,0.12))',
            boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
            fontSize: '13px',
            lineHeight: 1.45,
            display: 'flex',
            gap: '8px',
          }}
        >
          <Share style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>{bookT(locale, 'installHintIos')}</span>
        </div>
      )}
    </div>
  );
}
