import { useState } from 'react';

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

function Landing() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(null);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(null);

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

  const getLocales = () => {
    if (!selectedLanguage) return [];
    return localesByLanguage[selectedLanguage] || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent mb-3 sm:mb-4">
            SpeakNative
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300">
            Choose Your Language & Locale
          </p>
        </header>

        {/* Main Content */}
        <main className="w-full">
          {!selectedLanguage ? (
            /* Language Selection */
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center text-gray-800 dark:text-white mb-6 sm:mb-8 lg:mb-12">
                Select Your Language
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
                <button
                  onClick={() => handleLanguageSelect('english')}
                  className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 p-8 sm:p-10 lg:p-12"
                  aria-label="Select English"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-6">
                      🇺🇸
                    </div>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-2">
                      English
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                      Learn American English
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleLanguageSelect('spanish')}
                  className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 p-8 sm:p-10 lg:p-12"
                  aria-label="Select Spanish"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-yellow-500/10 dark:from-red-500/20 dark:to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="text-5xl sm:text-6xl lg:text-7xl mb-4 sm:mb-6">
                      🇨🇴
                    </div>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-2">
                      Spanish
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                      Learn Colombian Spanish
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : !selectedLocale ? (
            /* Locale Selection */
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center justify-center gap-4 mb-6 sm:mb-8 lg:mb-12">
                <button
                  onClick={handleReset}
                  className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium flex items-center gap-2 text-base sm:text-lg"
                  aria-label="Back to language selection"
                >
                  <span className="text-xl sm:text-2xl">←</span> Back
                </button>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center text-gray-800 dark:text-white mb-6 sm:mb-8 lg:mb-12">
                Select Your Locale
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
                {getLocales().map((locale) => (
                  <button
                    key={locale.value}
                    onClick={() => handleLocaleSelect(locale.value)}
                    className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 p-8 sm:p-10 lg:p-12"
                    aria-label={`Select ${locale.label}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                      <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">
                        📍
                      </div>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mb-2">
                        {locale.label}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
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
              <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl p-8 sm:p-10 lg:p-16 text-center">
                <div className="text-6xl sm:text-7xl lg:text-8xl mb-6 sm:mb-8">
                  ✨
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">
                  Selection Complete!
                </h2>
                <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Language:</span>{' '}
                    <span className="text-violet-600 dark:text-violet-400 capitalize">
                      {selectedLanguage}
                    </span>
                  </p>
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Locale:</span>{' '}
                    <span className="text-violet-600 dark:text-violet-400">
                      {getLocales().find((l) => l.value === selectedLocale)?.label}
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-3 sm:py-4 px-8 sm:px-12 rounded-full text-base sm:text-lg transition duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  aria-label="Start over"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-8 sm:mt-12 lg:mt-16 text-sm sm:text-base text-gray-600 dark:text-gray-400">
          <p>Master the language and culture of your chosen region</p>
        </footer>
      </div>
    </div>
  );
}

export default Landing;
