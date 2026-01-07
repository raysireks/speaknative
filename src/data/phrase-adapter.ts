import manifest from './phrases-manifest.json';

export interface PhraseEntry {
    id: number;
    common: Record<string, string>;
    slang: Record<string, string>;
}

export interface Phrase {
    id: number;
    text: string;
    translation: string;
    slangText?: string;
    slangTranslation?: string;
}

const data = manifest as PhraseEntry[];


// Aggregate locales - maps a virtual locale to its constituent locales
const AGGREGATE_LOCALES: Record<string, string[]> = {
    // US is now just California, so no complex aggregation needed, but we can map 'us' to 'us-ca' for simplicity
    us: ['us-ca'],
    co: ['co-cartagena', 'co-medellin'],
};

// Get the first available value from a set of locales
function getFirstAvailable(
    record: Record<string, string>,
    locales: string[]
): string | undefined {
    for (const locale of locales) {
        if (record[locale]) return record[locale];
    }
    return undefined;
}

// Get a specific locale value, or fallback to first available from aggregate
function getLocaleValue(
    record: Record<string, string>,
    locale: string
): string | undefined {
    // First try exact match
    if (record[locale]) return record[locale];

    // Then try aggregate fallback
    const aggregateLocales = AGGREGATE_LOCALES[locale];
    if (aggregateLocales) {
        return getFirstAvailable(record, aggregateLocales);
    }

    return undefined;
}

// Resolve a locale to its constituent locales (or itself if not an aggregate)
function resolveLocale(locale: string): string[] {
    return AGGREGATE_LOCALES[locale] || [locale];
}

/**
 * Get phrases for learning from sourceLocale to targetLocale
 * e.g., getPhrasesForLocale('co-cartagena', 'us') returns Spanish → English
 */
export function getPhrasesForLocale(
    sourceLocale: string,
    targetLocale: string
): Phrase[] {
    const targetLocales = resolveLocale(targetLocale);

    return data.map((entry) => ({
        id: entry.id,
        text: getLocaleValue(entry.common, sourceLocale) || '',
        translation: getFirstAvailable(entry.common, targetLocales) || '',
        slangText: getLocaleValue(entry.slang, sourceLocale),
        slangTranslation: getFirstAvailable(entry.slang, targetLocales),
    }));
}

export function getPhraseById(id: number): PhraseEntry | undefined {
    return data.find((entry) => entry.id === id);
}

// Available Colombian locales for the app
export const AVAILABLE_LOCALES = [
    { code: 'co-cartagena', name: 'Cartagena, Colombia', flag: '🌴' },
    { code: 'co-medellin', name: 'Medellín, Colombia', flag: '🏔️' },
];
