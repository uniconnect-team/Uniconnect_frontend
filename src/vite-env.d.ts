/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_AUTH_API?: string
  readonly VITE_DORMS_API?: string
  readonly VITE_BOOKING_API?: string
  readonly VITE_PROFILES_API?: string
  readonly VITE_MEDIA_API?: string
  readonly VITE_NOTIFICATIONS_API?: string
  readonly VITE_CORE_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}