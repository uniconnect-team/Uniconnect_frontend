/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_AUTH_API_URL?: string
  readonly VITE_PROFILES_API_URL?: string
  readonly VITE_DORMS_API_URL?: string
  readonly VITE_BOOKING_API_URL?: string
  readonly VITE_MEDIA_API_URL?: string
  readonly VITE_NOTIFICATIONS_API_URL?: string
  readonly VITE_CORE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}