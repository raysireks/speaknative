import { functions, httpsCallable, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface PhraseEntry {
  id: number;
  common: Record<string, string>;
  slang: Record<string, string>;
}

export interface Phrase {
  id: number | string;
  text: string; // The phrase in Target Locale
  translation: string; // The phrase in User Locale
  slangText?: string;
  slangTranslation?: string;
  is_slang?: boolean;
  usage_count?: number;
}

/**
 * Map UI locales to Backend ISO codes
 */
const LOCALE_MAP: Record<string, string> = {
  'co-cartagena': 'es-CO-CTG',
  'co-medellin': 'es-CO-MDE',
  'us-eastcoast': 'en-US-CA',
  'us-midwest': 'en-US-CA',
  'en': 'en-US-CA',
  'es': 'es-CO-MDE'
};

export function getPhrasesForLocale(): Phrase[] {
  return [];
}

export function getPhraseById(): PhraseEntry | undefined {
  return undefined;
}

// Available Colombian locales for the app
export const AVAILABLE_LOCALES = [
  { code: 'co-cartagena', name: 'Cartagena, Colombia', flag: '🌴' },
  { code: 'co-medellin', name: 'Medellín, Colombia', flag: '🏔️' },
  { code: 'fr', name: 'France', flag: '🇫🇷' },
  { code: 'de', name: 'Germany', flag: '🇩🇪' },
  { code: 'it', name: 'Italy', flag: '🇮🇹' },
];

/**
 * Fetch Top Phrases from the Global Cache (generated weekly)
 * @param locale UI locale code
 */
export async function fetchCachedPhrases(locale: string): Promise<Phrase[]> {
  try {
    const backendLocale = LOCALE_MAP[locale] || locale;
    const cacheRef = doc(db, 'cache_top_phrases', backendLocale);
    const snapshot = await getDoc(cacheRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      const phrases = data.phrases || []; // Array of optimized objects
      console.log(`Loaded ${phrases.length} phrases from cache for ${backendLocale}`);

      // Map to UI Phrase interface
      return phrases.map((p: any) => ({
        id: p.id,
        text: p.text,
        // We need the translation in the user's language.
        // The cache object structure is: { translations: { 'en-US-CA': "..." } }
        // BUT here we don't know the USER locale easily without passing it.
        // Let's assume this view is "Explore Target Locale".
        // The caller of fetchCachedPhrases knows the target locale. 
        // We might need to handle translation mapping in getDynamicPhrases.
        // For now, return the raw object structure or specific fields.
        translations: p.translations,
        translation: '', // will be filled by consumer
        usage_count: p.usage_count,
        is_slang: p.is_slang
      }));
    }
  } catch (error) {
    console.warn(`Cache miss or error for ${locale}:`, error);
  }
  return [];
}

/**
 * Direct Translation: User asks for a translation
 */
export async function translatePhrase(text: string, userLocale: string, targetLocale: string): Promise<Phrase | null> {
  const translateParams = {
    text,
    userLocale: LOCALE_MAP[userLocale] || userLocale,
    targetLocale: LOCALE_MAP[targetLocale] || targetLocale
  };

  try {
    const translateFn = httpsCallable(functions, 'translateAndStore');
    const result: any = await translateFn(translateParams);
    const data = result.data;

    return {
      id: data.id,
      text: data.text,
      translation: text, // The input was the user text (usually)
      is_slang: data.is_slang,
      usage_count: data.usage_count
    };
  } catch (e) {
    console.error("Translation failed", e);
    return null;
  }
}

/**
 * Get dynamic phrases from Firestore for a specific locale
 * 1. Try Global Cache.
 */
export async function getDynamicPhrases(targetLocale: string, userLocale: string): Promise<Phrase[]> {
  const backendUser = LOCALE_MAP[userLocale] || userLocale;

  // 1. Try Cache
  const cached = await fetchCachedPhrases(targetLocale);
  if (cached && cached.length > 0) {
    // Map the cached items to show translation in User Locale
    return cached.map((p: any) => ({
      ...p,
      translation: p.translations?.[backendUser] || 'Translation unavailable'
    }));
  }

  return [];
}
