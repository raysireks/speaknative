/* eslint-disable @typescript-eslint/no-explicit-any */
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAI } from "firebase/ai";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const config = typeof __FIREBASE_CONFIG__ !== 'undefined' ? __FIREBASE_CONFIG__ : {
    apiKey: "demo-key",
    authDomain: "demo.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
export const app = initializeApp(config);

// Enable App Check debug mode for local development
if (import.meta.env.DEV) {
    if (import.meta.env.VITE_APPCHECK_DEBUG_TOKEN) {
        // @ts-expect-error - This is a special debug flag for App Check
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
        console.log('App Check: Using debug token from .env.local');
    } else {
        // @ts-expect-error - This is a special debug flag for App Check
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = "4C03A0BA-627A-4E9D-ABA8-105DAB90D449";
        console.log('App Check: Using hardcoded debug token');
    }
}

// Initialize App Check
export let appCheck: any = null;
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
    appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
    });
    console.log('App Check: Initialized with reCAPTCHA v3');
} else {
    console.warn('App Check: SKIPPED (VITE_RECAPTCHA_SITE_KEY missing)');
}

export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const functions = getFunctions(app);
export const db = getFirestore(app);
export { httpsCallable };

export const ai = getAI(app);

if (import.meta.env.DEV && import.meta.env.VITE_USE_AUTH_EMULATOR === 'true') {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFunctionsEmulator(functions, "localhost", 5001);
    connectFirestoreEmulator(db, "localhost", 8080);
    auth.settings.appVerificationDisabledForTesting = true;
    console.log('Firebase Auth, Functions & Firestore Emulators Connected');
}
