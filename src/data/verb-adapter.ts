import verbsManifest from './verbs-manifest.json';

export interface VerbEntry {
  id: string;
  infinitive: Record<string, string>;
  data: Record<string, VerbConjugation>;
}

export interface VerbConjugation {
  present: Record<string, string>;
  past: Record<string, string>;
  future: Record<string, string>;
}

// Flattened structure for UI consumption
export interface Verb {
  id: string;
  infinitive: string;
  translation: string;
  conjugation: VerbConjugation; // Current locale's conjugation
  translationConjugation: VerbConjugation; // Target locale's conjugation (if needed for reference, usually just need infinitive translation)
}

const verbsData = verbsManifest as VerbEntry[];

// Reuse locale resolution logic if possible or duplicate simple version
const AGGREGATE_LOCALES: Record<string, string[]> = {
  us: ['us-ca'],
  co: ['co-cartagena', 'co-medellin'],
};

function getFirstAvailable<T>(record: Record<string, T>, locales: string[]): T | undefined {
  for (const locale of locales) {
    if (record[locale]) return record[locale];
  }
  return undefined;
}

function getLocaleValue<T>(record: Record<string, T>, locale: string): T | undefined {
  if (record[locale]) return record[locale];
  const aggregateLocales = AGGREGATE_LOCALES[locale];
  if (aggregateLocales) {
    return getFirstAvailable(record, aggregateLocales);
  }
  return undefined;
}

export function getVerbsForLocale(
  sourceLocale: string, // e.g. 'es' or 'co-cartagena' (User's Native) -> actually in this app logic is reversed often
  targetLocale: string // e.g. 'en' or 'us-ca' (Target)
): Verb[] {
  // If user is Native Spanish (co-cartagena), they want to learn English (us-ca).
  // Infinitive should be shown in Target first? Or Source?
  // App logic: "Phrase to learn" (Target), "Your language" (Source)

  // We need to resolve the locales to specific keys in the data
  // The data keys are specific: 'co-cartagena', 'us-ca'

  // For verbs, we want to return the object with both languages accessible so the UI can switch
  // But adhering to the interface:

  return verbsData.map((v) => {
    const sourceInf = getLocaleValue(v.infinitive, sourceLocale) || '';
    const targetInf = getLocaleValue(v.infinitive, targetLocale) || '';

    const sourceConj = getLocaleValue(v.data, sourceLocale);
    const targetConj = getLocaleValue(v.data, targetLocale);

    return {
      id: v.id,
      infinitive: targetInf, // Learn this
      translation: sourceInf, // Native meaning
      conjugation: targetConj!, // Learn these forms
      translationConjugation: sourceConj!, // Reference forms
    };
  });
}

export function getVerbById(id: string): VerbEntry | undefined {
  return verbsData.find((v) => v.id === id);
}
