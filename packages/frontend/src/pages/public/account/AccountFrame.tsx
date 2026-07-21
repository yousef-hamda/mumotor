import { useEffect, type CSSProperties, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { useTemplateFonts } from '../../../templates/shared';
import { dirForLocale, FONT_HREFS, resolveBookTheme } from '../../../lib/templateTheme';
import { bookLocale, bookT } from '../../../lib/bookingStrings';
import { applyAppIdentity, resetToMumotorIdentity, siteAppIdentity } from '../../../lib/pwa';
import { slotRange, formatDate, formatMsgTime, ChatThread, ProfileForm } from './primitives';
import type { AccountPrimitives, AccountSkinProps } from './types';
import type { AccountState } from './useStudentAccount';
import './account.css';

/**
 * Shared scaffolding every bespoke dashboard sits inside. It provides ONLY the
 * cross-cutting concerns — the template's palette vars (via `.tmpl-<slug>` +
 * the teacher's `customization.theme` applied inline so recolour holds), its
 * fonts, the PWA identity swap, and the shared loading/error/footer chrome. Each
 * skin renders its own header + content (that's the bespoke part).
 */
export function AccountFrame({
  slug,
  theme,
  schoolName,
  logoSrc,
  publicSlug,
  locale,
  state,
  Skin,
}: {
  slug: string;
  theme?: Record<string, string> | null;
  schoolName: string;
  logoSrc: string | null;
  publicSlug: string;
  /** The SITE's locale — fallback while `state.data` is null (loading/error),
   *  so those screens don't render English/LTR on an HE/AR site. */
  locale?: string | null;
  state: AccountState;
  Skin: ComponentType<AccountSkinProps>;
}) {
  const fontHref = FONT_HREFS[slug] ?? FONT_HREFS.mumotor;
  useTemplateFonts([fontHref]);

  // Resolve the template palette both ways: the `.tmpl-<slug>` class + `theme`
  // give bespoke skins the template's OWN vars (--ci-red …); the normalized
  // `--book-*` set (added below) lets the portable default skin theme any template.
  const bt = resolveBookTheme(slug, theme);
  const accent = bt.vars['--book-accent'];
  useEffect(() => {
    if (!publicSlug) return;
    applyAppIdentity(siteAppIdentity({ slug: publicSlug, name: schoolName ?? '', accent, logoSrc }));
    return () => resetToMumotorIdentity();
  }, [publicSlug, schoolName, accent, logoSrc]);

  const dir = state.data?.dir ?? dirForLocale(locale);
  const L = state.data?.locale ?? bookLocale(locale);

  const ui: AccountPrimitives = {
    slotRange,
    formatDate: (iso) => formatDate(iso, L),
    formatMsgTime: (iso) => formatMsgTime(iso, L),
    t: (key, vars) => bookT(L, key as Parameters<typeof bookT>[1], vars),
    ChatThread,
    ProfileForm,
  };

  return (
    <div
      className={cn(`tmpl-${slug}`, 'account-root', `account-${slug}`)}
      dir={dir}
      data-account
      data-theme={bt.isDark ? 'dark' : 'light'}
      style={{ ...(theme ?? {}), ...bt.vars } as CSSProperties}
    >
      {state.status === 'loading' && (
        <div className="account-fallback">
          <span className="account-spin" aria-hidden="true" />
          <span>{bookT(L, 'loadingAccount')}</span>
        </div>
      )}
      {state.status === 'error' && (
        <div className="account-fallback">
          <p>{bookT(L, 'accountLoadError')}</p>
          <button className="account-retry" onClick={state.retry}>
            {bookT(L, 'retry')}
          </button>
        </div>
      )}
      {state.status === 'ready' && state.data && (
        <main className="account-main">
          <Skin data={state.data} actions={state.actions} L={L} dir={dir} ui={ui} />
        </main>
      )}
      <footer className="account-footer">
        {bookT(L, 'poweredBy')} <Link to="/">Mumotor</Link>
      </footer>
    </div>
  );
}
