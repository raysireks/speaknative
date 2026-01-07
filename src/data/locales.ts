/**
 * App UI Localization
 * English keys with translations to supported languages
 */

export type SupportedLocale = 'en' | 'es';

export interface LocaleStrings {
    es: string;
}

// All UI text in the app - English is the key, other languages are properties
export const UI_TEXT: Record<string, LocaleStrings> = {
    // App Header
    'SpeakNative': { es: 'SpeakNative' },
    'Learn': { es: 'Aprende' },

    // Landing Page
    'I speak:': { es: 'Yo hablo:' },
    'Choose a region to learn': { es: 'Elige una región para aprender' },
    'Ready to Learn!': { es: '¡Listo para Aprender!' },
    'You speak:': { es: 'Tú hablas:' },
    'Learning:': { es: 'Aprendiendo:' },
    'Start Flashcards': { es: 'Iniciar Tarjetas' },
    'Start Verbs': { es: 'Iniciar Verbos' },
    'Change Region': { es: 'Cambiar Región' },
    'Master the language and culture of your chosen region': {
        es: 'Domina el idioma y la cultura de tu región elegida',
    },

    // Flashcard Settings
    'Flashcard Settings': { es: 'Configuración de Tarjetas' },
    'Region:': { es: 'Región:' },
    'Phrases:': { es: 'Frases:' },
    'Each flashcard shows a phrase to learn. Tap reveal to see it in your language.': {
        es: 'Cada tarjeta muestra una frase. Toca revelar para verla en tu idioma.',
    },
    'Start Learning': { es: 'Comenzar a Aprender' },

    // Flashcard UI
    'Settings': { es: 'Configuración' },
    'Phrase to learn': { es: 'Frase para aprender' },
    'SLANG': { es: 'JERGA' },
    'Listen': { es: 'Escuchar' },
    'Reveal': { es: 'Revelar' },
    'Your language': { es: 'Tu idioma' },
    '← Previous': { es: '← Anterior' },
    'Next →': { es: 'Siguiente →' },

    // Navigation
    '← Back': { es: '← Atrás' },
    'Back': { es: 'Atrás' },

    // Errors
    'No Phrases Available': { es: 'No Hay Frases Disponibles' },
    'Go Back': { es: 'Volver' },

    // Audio
    '🔊 Audio playback coming soon!': { es: '🔊 ¡Reproducción de audio próximamente!' },

    // Verbs
    'Top 50 Verbs': { es: 'Top 50 Verbos' },
    'Tense': { es: 'Tiempo' },
    'Person': { es: 'Persona' },
    'Present': { es: 'Presente' },
    'Past': { es: 'Pasado' },
    'Future': { es: 'Futuro' },
    'Next Verb': { es: 'Siguiente Verbo' },
    'Prev Verb': { es: 'Verbo Anterior' },
};

/**
 * Get translated text for the given key and locale
 * If the locale is 'en' or translation not found, returns the key (English)
 */
export function getText(key: string, locale: SupportedLocale): string {
    if (locale === 'en') return key;
    return UI_TEXT[key]?.[locale] ?? key;
}
