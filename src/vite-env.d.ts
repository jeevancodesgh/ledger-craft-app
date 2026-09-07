/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CUSTOMERS_API?: string
  readonly VITE_BUSINESS_API?: string
  readonly VITE_ITEMS_API?: string
  readonly VITE_INVOICES_API?: string
}

// PWA Virtual Module Types
declare module 'virtual:pwa-register' {
  export function registerSW(options?: {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
  }): (reloadPage?: boolean) => Promise<void>
}
