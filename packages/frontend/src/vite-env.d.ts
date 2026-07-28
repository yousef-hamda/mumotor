/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_BASE?: string;
  /** Google OAuth Web client id — enables the "Continue with Google" button. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Minimal typing for the Google Identity Services script (loaded on demand). */
interface GoogleIdCallbackResponse {
  credential?: string;
}
interface GoogleAccountsId {
  initialize(config: { client_id: string; callback: (r: GoogleIdCallbackResponse) => void; auto_select?: boolean }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  cancel(): void;
}
interface Window {
  google?: { accounts?: { id?: GoogleAccountsId } };
}
