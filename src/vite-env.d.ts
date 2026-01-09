/// <reference types="vite/client" />

declare const __FIREBASE_CONFIG__: any;

interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string
    readonly VITE_FIREBASE_AUTH_DOMAIN: string
    readonly VITE_FIREBASE_PROJECT_ID: string
    readonly VITE_FIREBASE_STORAGE_BUCKET: string
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
    readonly VITE_FIREBASE_APP_ID: string
    readonly VITE_FIREBASE_MEASUREMENT_ID: string
    readonly VITE_USE_AUTH_EMULATOR: string
    readonly VITE_RECAPTCHA_SITE_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
