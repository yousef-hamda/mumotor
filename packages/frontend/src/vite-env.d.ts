/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
