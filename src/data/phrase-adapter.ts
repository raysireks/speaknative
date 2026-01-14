/* eslint-disable @typescript-eslint/no-explicit-any */
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
  variants?: {
    text: string;
    is_slang: boolean;
    is_question?: boolean;
    score?: number;
  }[];
}

/**
 * Map UI locales to Backend ISO codes
 */
const LOCALE_MAP: Record<string, string> = {
  'co-cartagena': 'es-CO-CTG',
  'co-medellin': 'es-CO-MDE',
  'us-ca': 'en-US-CA',
  'us-eastcoast': 'en-US-CA',
  'us-midwest': 'en-US-CA',
  'en-US-CA': 'en-US-CA',
  'es-CO-CTG': 'es-CO-CTG',
  'es-CO-MDE': 'es-CO-MDE',
  'en': 'en-US-CA',
  'es': 'es-CO-MDE',
  'en-US': 'en-US-CA',
  'es-CO': 'es-CO-MDE'
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
        variants: p.variants, // UPDATED: Key is 'variants' in DB
        translation: '',
        usage_count: p.usage_count,
        is_slang: p.is_slang
      }));
    }
  } catch (error) {
    console.warn(`Cache miss or error for ${locale}:`, error);
  }
  return [];
}

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


  // 1. Try Cache for USER LOCALE (Source of Truth for "Concepts")
  // We want to learn [TargetLocale], so we grab the UserLocale list (Source phrases)
  // and show the TargetLocale variants.
  const cached = await fetchCachedPhrases(userLocale);

  if (cached && cached.length > 0) {
    return cached.map((p: Phrase) => {
      const backendTargetLocale = LOCALE_MAP[targetLocale] || targetLocale;
      const targetVariantsRaw = (p.variants as any)?.[backendTargetLocale] || [];

      let primary = '';
      let variants: { text: string; is_slang: boolean; score?: number }[] = [];

      // Logic: 
      // - primary (PhraseToLearn) = The First Variant in Target Locale
      // - translation (PhraseInUserLang) = The Source Text (p.text)

      if (Array.isArray(targetVariantsRaw) && targetVariantsRaw.length > 0) {
        variants = targetVariantsRaw;
        primary = variants[0].text;
      } else {
        // If no target variants, we might skip this phrase or show placeholder
        // For now, we'll mark it as empty so the UI filters it out
        primary = '';
      }

      return {
        ...p,
        text: primary, // usage in UI: phraseToLearn
        translation: p.text, // usage in UI: phraseInUserLang (Source)
        slangText: variants.find((v: any) => v.is_slang)?.text,
        is_slang: variants.some((v: any) => v.is_slang),
        variants: variants
      };
    }).filter(p => p.text !== ''); // Only return phrases that have a target translation
  }

  return [];
}
