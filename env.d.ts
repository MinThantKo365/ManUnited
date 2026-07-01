/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FOOTBALL_API_KEY?: string
  readonly VITE_X_AUTH_TOKEN?: string
  /** Season start year, e.g. 2026 for 2026/27 */
  readonly VITE_FOOTBALL_SEASON?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
