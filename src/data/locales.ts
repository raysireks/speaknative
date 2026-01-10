import { functions, httpsCallable } from '../lib/firebase';

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';

export interface LocaleStrings {
  [locale: string]: string;
}

// Basic UI text remains hardcoded for speed and offline availability
export const UI_TEXT: Record<string, LocaleStrings> = {
  // App Header
  SpeakNative: { es: 'SpeakNative' },
  Learn: { es: 'Aprende' },
  // ... (keeping some key ones)
  'I speak:': { es: 'Yo hablo:' },
  'Choose a region to learn': { es: 'Elige una región para aprender' },
  'Ready to Learn!': { es: '¡Listo para Aprender!' },
  'Start Flashcards': { es: 'Iniciar Tarjetas' },
  'Start Verbs': { es: 'Iniciar Verbos' },
  'Audio Challenge': { es: 'Desafío de Audio' },
  'Translation Challenge': { es: 'Desafío de Traducción' },
  Settings: { es: 'Configuración' },
  Back: { es: 'Atrás' },
  'Next →': { es: 'Siguiente →' },
  '← Previous': { es: '← Anterior' },
};

/**
 * Get translated text for UI elements (synchronous)
 */
export function getText(key: string, locale: string): string {
  if (locale === 'en') return key;
  return UI_TEXT[key]?.[locale] ?? key;
}

/**
 * Dynamic translation lookup using Vector Search (asynchronous)
 */
export async function translatePhrase(phrase: string, targetLocale: string): Promise<{ common: string, slang?: string }> {
  if (targetLocale === 'en') return { common: phrase };

  try {
    // 1. Get embedding for the phrase (usually we'd do this client-side or call a function)
    const getSimilarPhrases = httpsCallable(functions, 'getSimilarPhrases');

    // For now, we'll use a simpler approach: call translateAndStore if not found, 
    // or search by embedding.
    // To keep it simple for the first iteration, we'll try to find an exact match first
    // or use a smarter lookup.

    const response = await getSimilarPhrases({ phrase, locale: targetLocale });
    const results = response.data as any[];

    if (results && results.length > 0) {
      const match = results[0];
      const translations = match.translations?.[targetLocale];
      if (translations) {
        return {
          common: translations.common,
          slang: translations.slang
        };
      }
    }

    // 2. If no similar phrase found, translate and store it
    const translateAndStore = httpsCallable(functions, 'translateAndStore');
    const transResponse = await translateAndStore({ phrase, locales: [targetLocale] });
    const transData = transResponse.data as any;

    return {
      common: transData.translations[targetLocale].common,
      slang: transData.translations[targetLocale].slang
    };
  } catch (error) {
    console.error('Translation error:', error);
    return { common: phrase };
  }
}
