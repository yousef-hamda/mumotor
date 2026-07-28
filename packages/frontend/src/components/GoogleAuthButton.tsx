import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { apiError } from '../lib/api';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = 'https://accounts.google.com/gsi/client';

/** Is Google sign-in configured for this build? */
export const googleEnabled = Boolean(CLIENT_ID);

// Load the Google Identity Services script once, shared across mounts.
let gsiPromise: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('gsi-load-failed'));
    document.head.appendChild(s);
  });
  return gsiPromise;
}

/** GIS locale codes are the base language (he/ar/en) — map from our app/site language. */
function gsiLocale(lang: string): string {
  const l = (lang || '').toLowerCase();
  return l.startsWith('he') ? 'he' : l.startsWith('ar') ? 'ar' : 'en';
}

/**
 * The official Google Identity Services button. Presentational + framework-agnostic:
 * it just gets a Google ID token (credential) and calls back. Reused by the teacher
 * auth pages AND the student portal. Renders NOTHING when VITE_GOOGLE_CLIENT_ID is
 * unset (dormant), so the whole Google path is tree-shaken out until configured.
 */
export function GoogleIdButton({
  onCredential,
  locale,
  text = 'continue_with',
  theme = 'outline',
  width = 320,
  disabled = false,
}: {
  onCredential: (credential: string) => void;
  locale?: string;
  text?: 'continue_with' | 'signin_with' | 'signup_with';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  width?: number;
  disabled?: boolean;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const cbRef = useRef(onCredential);
  cbRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        const id = window.google?.accounts?.id;
        if (cancelled || !holderRef.current || !id) return;
        id.initialize({
          client_id: CLIENT_ID!,
          callback: (resp) => {
            if (resp.credential) cbRef.current(resp.credential);
          },
        });
        holderRef.current.innerHTML = '';
        id.renderButton(holderRef.current, {
          type: 'standard',
          theme,
          size: 'large',
          text,
          shape: 'pill',
          width,
          locale: gsiLocale(locale || 'en'),
        });
      })
      .catch(() => {
        /* offline / script blocked — button just won't appear, other login methods still work */
      });
    return () => {
      cancelled = true;
    };
  }, [locale, text, theme, width]);

  if (!CLIENT_ID) return null;
  return <div ref={holderRef} className={`flex justify-center ${disabled ? 'pointer-events-none opacity-60' : ''}`} />;
}

/**
 * "Continue with Google" for the TEACHER auth pages (login + register): renders the
 * button, then exchanges the credential for a session via loginWithGoogle. Dormant
 * (null) when Google isn't configured.
 */
export function GoogleAuthButton({ redirectTo = '/dashboard' }: { redirectTo?: string }) {
  const { t, i18n } = useTranslation();
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  if (!CLIENT_ID) return null; // dormant until configured

  const handle = async (credential: string) => {
    setBusy(true);
    try {
      await loginWithGoogle(credential);
      toast.success(t('auth.welcomeToast'));
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(apiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-wide text-sand-400">
        <span className="h-px flex-1 bg-sand-200" />
        {t('auth.orDivider')}
        <span className="h-px flex-1 bg-sand-200" />
      </div>
      <GoogleIdButton onCredential={handle} locale={i18n.language} disabled={busy} />
    </div>
  );
}
