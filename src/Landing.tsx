import { useState } from 'react';
import { appLanguages } from './data/appLanguages';

type Language = 'english' | 'spanish' | null;
type Locale = string | null;

interface LocaleOption {
  value: string;
  label: string;
}

const localesByLanguage: Record<string, LocaleOption[]> = {
  english: [
    { value: 'us-midwest', label: 'United States - Midwest' },
    { value: 'us-eastcoast', label: 'United States - East Coast' },
  ],
  spanish: [
    { value: 'co-cartagena', label: 'Colombia - Cartagena' },
    { value: 'co-medellin', label: 'Colombia - Medellín' },
  ],
};

interface LandingProps {
  onStartFlashcards?: (locale: string) => void;
}

function Landing({ onStartFlashcards }: LandingProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(null);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(null);
  const [appLanguage, setAppLanguage] = useState('en');

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setSelectedLocale(null);
  };

  const handleLocaleSelect = (locale: string) => {
    setSelectedLocale(locale);
  };

  const handleReset = () => {
    setSelectedLanguage(null);
    setSelectedLocale(null);
  };

  const handleStartLearning = () => {
    if (selectedLocale && onStartFlashcards) {
      onStartFlashcards(selectedLocale);
    }
  };

  const getLocales = () => {
    if (!selectedLanguage) return [];
    return localesByLanguage[selectedLanguage] || [];
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 p-4 sm:p-6 lg:p-8 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      <div className="w-full max-w-7xl">
        {/* App Language Selector */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <div className="flex gap-2 rounded-full bg-white p-2 shadow-lg dark:bg-gray-800">
            {appLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setAppLanguage(lang.code)}
                className={`rounded-full px-4 py-2 font-medium transition-all duration-300 ${
                  appLanguage === lang.code
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
                aria-label={`Switch to ${lang.name}`}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <header className="mt-16 mb-8 text-center sm:mt-0 sm:mb-12 lg:mb-16">
          <h1 className="mb-3 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent sm:mb-4 sm:text-5xl md:text-6xl lg:text-7xl dark:from-violet-400 dark:to-purple-400">
            SpeakNative
          </h1>
          <p className="text-lg text-gray-700 sm:text-xl md:text-2xl dark:text-gray-300">
            Choose Your Language & Locale
          </p>
        </header>

        {/* Main Content */}
        <main className="w-full">
          {!selectedLanguage ? (
            /* Language Selection */
            <div className="animate-in fade-in duration-500">
              <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800 sm:mb-8 sm:text-3xl md:text-4xl lg:mb-12 dark:text-white">
                Select Your Language
              </h2>
              <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 sm:gap-6 lg:gap-8">
                <button
                  onClick={() => handleLanguageSelect('english')}
                  className="group relative transform overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:rounded-3xl sm:p-10 lg:p-12 dark:bg-gray-800"
                  aria-label="Select English"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-500/20 dark:to-indigo-500/20"></div>
                  <div className="relative z-10">
                    <div className="mb-4 text-5xl sm:mb-6 sm:text-6xl lg:text-7xl">🇺🇸</div>
                    <h3 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl lg:text-4xl dark:text-white">
                      English
                    </h3>
                    <p className="text-base text-gray-600 sm:text-lg dark:text-gray-300">
                      Learn American English
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleLanguageSelect('spanish')}
                  className="group relative transform overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:rounded-3xl sm:p-10 lg:p-12 dark:bg-gray-800"
                  aria-label="Select Spanish"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-yellow-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-red-500/20 dark:to-yellow-500/20"></div>
                  <div className="relative z-10">
                    <div className="mb-4 text-5xl sm:mb-6 sm:text-6xl lg:text-7xl">🇨🇴</div>
                    <h3 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl lg:text-4xl dark:text-white">
                      Spanish
                    </h3>
                    <p className="text-base text-gray-600 sm:text-lg dark:text-gray-300">
                      Learn Colombian Spanish
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : !selectedLocale ? (
            /* Locale Selection */
            <div className="animate-in fade-in duration-500">
              <div className="mb-6 flex items-center justify-center gap-4 sm:mb-8 lg:mb-12">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-base font-medium text-violet-600 hover:text-violet-700 sm:text-lg dark:text-violet-400 dark:hover:text-violet-300"
                  aria-label="Back to language selection"
                >
                  <span className="text-xl sm:text-2xl">←</span> Back
                </button>
              </div>
              <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800 sm:mb-8 sm:text-3xl md:text-4xl lg:mb-12 dark:text-white">
                Select Your Locale
              </h2>
              <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 sm:gap-6 lg:gap-8">
                {getLocales().map((locale) => (
                  <button
                    key={locale.value}
                    onClick={() => handleLocaleSelect(locale.value)}
                    className="group relative transform overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:rounded-3xl sm:p-10 lg:p-12 dark:bg-gray-800"
                    aria-label={`Select ${locale.label}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-purple-500/20 dark:to-pink-500/20"></div>
                    <div className="relative z-10">
                      <div className="mb-4 text-4xl sm:mb-6 sm:text-5xl lg:text-6xl">📍</div>
                      <h3 className="mb-2 text-xl font-bold text-gray-800 sm:text-2xl lg:text-3xl dark:text-white">
                        {locale.label}
                      </h3>
                      <p className="text-sm text-gray-600 sm:text-base dark:text-gray-300">
                        Regional dialect & culture
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Selection Complete */
            <div className="animate-in fade-in duration-500">
              <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-2xl sm:rounded-3xl sm:p-10 lg:p-16 dark:bg-gray-800">
                <div className="mb-6 text-6xl sm:mb-8 sm:text-7xl lg:text-8xl">✨</div>
                <h2 className="mb-4 text-3xl font-bold text-gray-800 sm:mb-6 sm:text-4xl md:text-5xl dark:text-white">
                  Selection Complete!
                </h2>
                <div className="mb-8 space-y-3 sm:mb-10 sm:space-y-4">
                  <p className="text-lg text-gray-700 sm:text-xl md:text-2xl dark:text-gray-300">
                    <span className="font-semibold">Language:</span>{' '}
                    <span className="text-violet-600 capitalize dark:text-violet-400">
                      {selectedLanguage}
                    </span>
                  </p>
                  <p className="text-lg text-gray-700 sm:text-xl md:text-2xl dark:text-gray-300">
                    <span className="font-semibold">Locale:</span>{' '}
                    <span className="text-violet-600 dark:text-violet-400">
                      {getLocales().find((l) => l.value === selectedLocale)?.label}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <button
                    onClick={handleStartLearning}
                    className="transform rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition duration-300 hover:scale-105 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl sm:px-12 sm:py-4 sm:text-lg"
                    aria-label="Start learning with flashcards"
                  >
                    Start Learning
                  </button>
                  <button
                    onClick={handleReset}
                    className="rounded-full bg-gray-200 px-8 py-3 text-base font-semibold text-gray-800 shadow-lg transition duration-300 hover:bg-gray-300 hover:shadow-xl sm:px-12 sm:py-4 sm:text-lg dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    aria-label="Start over"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-600 sm:mt-12 sm:text-base lg:mt-16 dark:text-gray-400">
          <p>Master the language and culture of your chosen region</p>
        </footer>
      </div>
    </div>
  );
}

export default Landing;
