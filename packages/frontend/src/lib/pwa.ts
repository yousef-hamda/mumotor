import { useEffect, useState } from 'react';

/**
 * Installable-PWA helpers (July 2026).
 *
 * The whole product is one SPA whose index.html is shared by the Mumotor app
 * AND every teacher's published site. So the Web App Manifest / icons / titles
 * must be swapped per route: on a published-site route we point them at the
 * teacher's dynamic manifest (`/site/:slug/manifest.webmanifest`) so installing
 * the site produces THAT instructor's app; everywhere else we keep Mumotor's.
 *
 * Nothing here changes desktop rendering — it only sets <head> hints the OS
 * reads when the page is installed / added to the home screen.
 */

// Mumotor (default) app identity — mirrors the static tags in index.html.
const MUMOTOR = {
  manifestHref: '/manifest.webmanifest',
  appleTouchHref: '/icons/apple-touch-icon.png',
  title: 'Mumotor',
  themeColor: '#FFFFFF',
} as const;

function setLinkHref(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  if (el.getAttribute('href') !== href) el.setAttribute('href', href);
}

function setMetaContent(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  if (el.getAttribute('content') !== content) el.setAttribute('content', content);
}

export interface AppIdentity {
  manifestHref: string;
  appleTouchHref: string;
  title: string;
  themeColor: string;
}

/** Point the manifest / apple-touch icon / titles / theme-color at `identity`. */
export function applyAppIdentity(identity: AppIdentity): void {
  if (typeof document === 'undefined') return;
  setLinkHref('manifest', identity.manifestHref);
  setLinkHref('apple-touch-icon', identity.appleTouchHref);
  setMetaContent('apple-mobile-web-app-title', identity.title);
  setMetaContent('theme-color', identity.themeColor);
}

/** Restore the default Mumotor app identity (call on app/marketing routes). */
export function resetToMumotorIdentity(): void {
  applyAppIdentity({ ...MUMOTOR });
}

/**
 * Build the teacher-site identity for a published site.
 * `slug` is the site slug; `name` the site name; `accent` the resolved accent
 * hex (for the installed status bar). apple-touch falls back to the generated
 * per-teacher SVG icon endpoint (iOS ignores SVG, so a raster logo is used when
 * available), else the site icon endpoint.
 */
export function siteAppIdentity(opts: { slug: string; name: string; accent?: string; logoSrc?: string | null }): AppIdentity {
  const manifestHref = `/site/${opts.slug}/manifest.webmanifest`;
  const raster = opts.logoSrc && /\.(png|jpe?g|webp)(\?|$)/i.test(opts.logoSrc) ? opts.logoSrc : null;
  const dataRaster = opts.logoSrc && /^data:image\/(png|jpe?g|webp)/i.test(opts.logoSrc) ? opts.logoSrc : null;
  return {
    manifestHref,
    appleTouchHref: raster || dataRaster || `/site/${opts.slug}/icon.svg`,
    title: opts.name || 'Driving lessons',
    themeColor: opts.accent || MUMOTOR.themeColor,
  };
}

/** Register the service worker (production builds only, when supported). */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return; // SW would fight Vite HMR in dev
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW registration failing must never break the app */
    });
  });
}

/** True when the page is running as an installed / home-screen app. */
export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** iOS (incl. iPadOS which masquerades as Mac) — needs the manual Add-to-Home-Screen flow. */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Install-affordance state. `canInstall` (Android/desktop) fires the native
 * prompt; on iOS we surface manual instructions instead. Hidden entirely when
 * already installed (`isStandalone`).
 */
export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const standalone = isStandaloneDisplay();
  const ios = isIOS();

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome === 'accepted';
  };

  return {
    /** Native install prompt is available (Android / desktop Chrome/Edge). */
    canInstall: Boolean(deferred),
    /** iOS — show manual "Share → Add to Home Screen" instructions. */
    isIOS: ios,
    /** Already running as an installed app → hide all install UI. */
    isStandalone: standalone || installed,
    promptInstall,
  };
}
