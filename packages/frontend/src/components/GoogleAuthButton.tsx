import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { apiError } from '../lib/api';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = 'https://accounts.google.com/gsi/client';

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

/** GIS locale codes are the base language (he/ar/en) — map from our app language. */
function gsiLocale(lang: string): string {
  const l = (lang || '').toLowerCase();
  return l.startsWith('he') ? 'he' : l.startsWith('ar') ? 'ar' : 'en';
}

/**
 * "Continue with Google" — renders the official Google Identity Services button, gets a
 * Google ID token, and exchanges it for our session via loginWithGoogle. Renders NOTHING
 * when VITE_GOOGLE_CLIENT_ID is unset (dormant, like the rest of the third-party integrations),
 * so the app is unchanged until Google is configured.
 */
export function GoogleAuthButton({ redirectTo = '/dashboard' }: { redirectTo?: string }) {
  const { t, i18n } = useTranslation();
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const holderRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  // Keep the latest handler without re-initializing GIS on every render.
  const handleRef = useRef<(credential: string) => void>(() => {});
  handleRef.current = async (credential: string) => {
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
            if (resp.credential) handleRef.current(resp.credential);
          },
        });
        holderRef.current.innerHTML = '';
        id.renderButton(holderRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 320,
          locale: gsiLocale(i18n.language),
        });
      })
      .catch(() => {
        /* offline / script blocked — the button simply doesn't appear, password login still works */
      });
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  if (!CLIENT_ID) return null; // dormant until configured

  return (
    <div className="mt-6">
      <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-wide text-sand-400">
        <span className="h-px flex-1 bg-sand-200" />
        {t('auth.orDivider')}
        <span className="h-px flex-1 bg-sand-200" />
      </div>
      <div ref={holderRef} className={`flex justify-center ${busy ? 'pointer-events-none opacity-60' : ''}`} />
    </div>
  );
}
