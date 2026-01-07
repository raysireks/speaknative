import { useState } from 'react';
import { useLocale } from './context/LocaleContext';
import type { SupportedLocale } from './data/locales';

type Locale = string | null;

interface LocaleOption {
  value: string;
  label: string;
  flag: string;
  description: string;
}

// All available learning regions by language
const LEARNING_REGIONS: Record<string, LocaleOption[]> = {
  // US English regions - for Spanish speakers to learn
  en: [
    {
      value: 'us-ca',
      label: 'California',
      flag: '🌴',
      description: 'Modern SoCal style',
    },
  ],
  // Colombian Spanish regions - for English speakers to learn
  es: [
    {
      value: 'co-cartagena',
      label: 'Cartagena',
      flag: '🌴',
      description: 'Caribbean coast dialect',
    },
    {
      value: 'co-medellin',
      label: 'Medellín',
      flag: '🏔️',
      description: 'Paisa region dialect',
    },
  ],
};

const LANGUAGE_INFO: Record<string, { name: string; flag: string; nativeName: string }> = {
  en: { name: 'English', flag: '🇺🇸', nativeName: 'English' },
  es: { name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
};

interface LandingProps {
  onStartFlashcards?: (targetLocale: string, userLocale: SupportedLocale) => void;
}

function Landing({ onStartFlashcards }: LandingProps) {
  const { locale: userLocale, setLocale: setUserLocale, t } = useLocale();
  const [selectedTargetLocale, setSelectedTargetLocale] = useState<Locale>(null);

  // Get the language to LEARN (opposite of user's language)
  const targetLanguage = userLocale === 'en' ? 'es' : 'en';
  const availableRegions = LEARNING_REGIONS[targetLanguage];
  const targetLangInfo = LANGUAGE_INFO[targetLanguage];
  const userLangInfo = LANGUAGE_INFO[userLocale];

  const handleRegionSelect = (locale: string) => {
    setSelectedTargetLocale(locale);
  };

  const handleReset = () => {
    setSelectedTargetLocale(null);
  };

  const handleStartLearning = () => {
    if (selectedTargetLocale && onStartFlashcards) {
      onStartFlashcards(selectedTargetLocale, userLocale);
    }
  };

  const getSelectedRegionInfo = () => {
    return availableRegions.find((l) => l.value === selectedTargetLocale);
  };

  const toggleUserLocale = () => {
    setUserLocale(userLocale === 'en' ? 'es' : 'en');
    setSelectedTargetLocale(null); // Reset selection when changing language
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 p-4 sm:p-6 lg:p-8 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      <div className="w-full max-w-7xl">
        {/* User Language Toggle - "I speak..." */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
              {t('I speak:')}
            </span>
            <button
              onClick={toggleUserLocale}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-medium shadow-lg transition-all duration-300 hover:shadow-xl dark:bg-gray-800"
              aria-label="Toggle my language"
            >
              <span className="text-xl">{userLangInfo.flag}</span>
              <span className="text-gray-700 dark:text-gray-300">
                {userLangInfo.nativeName}
              </span>
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="mb-8 text-center sm:mb-12 lg:mb-16">
          <h1 className="mb-3 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent sm:mb-4 sm:text-5xl md:text-6xl lg:text-7xl dark:from-violet-400 dark:to-purple-400">
            {t('SpeakNative')}
          </h1>
          <p className="text-lg text-gray-700 sm:text-xl md:text-2xl dark:text-gray-300">
            {t('Learn')} {targetLangInfo.name} {targetLangInfo.flag}
          </p>
        </header>

        {/* Main Content */}
        <main className="w-full">
          {!selectedTargetLocale ? (
            /* Region Selection */
            <div className="animate-in fade-in duration-500">
              <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800 sm:mb-8 sm:text-3xl md:text-4xl lg:mb-12 dark:text-white">
                {t('Choose a region to learn')}
              </h2>
              <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 sm:gap-6 lg:gap-8">
                {availableRegions.map((region) => (
                  <button
                    key={region.value}
                    onClick={() => handleRegionSelect(region.value)}
                    className="group relative transform overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl sm:rounded-3xl sm:p-10 lg:p-12 dark:bg-gray-800"
                    aria-label={`Select ${region.label}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-purple-500/20 dark:to-pink-500/20"></div>
                    <div className="relative z-10">
                      <div className="mb-4 text-5xl sm:mb-6 sm:text-6xl lg:text-7xl">
                        {region.flag}
                      </div>
                      <h3 className="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl lg:text-4xl dark:text-white">
                        {region.label}
                      </h3>
                      <p className="text-base text-gray-600 sm:text-lg dark:text-gray-300">
                        {region.description}
                      </p>
                      <div className="mt-4 text-sm text-violet-600 font-medium dark:text-violet-400">
                        {targetLangInfo.flag} {targetLangInfo.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Selection Complete */
            <div className="animate-in fade-in duration-500">
              <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow-2xl sm:rounded-3xl sm:p-10 lg:p-16 dark:bg-gray-800">
                <div className="mb-6 text-6xl sm:mb-8 sm:text-7xl lg:text-8xl">
                  {getSelectedRegionInfo()?.flag}
                </div>
                <h2 className="mb-4 text-3xl font-bold text-gray-800 sm:mb-6 sm:text-4xl md:text-5xl dark:text-white">
                  {t('Ready to Learn!')}
                </h2>
                <div className="mb-8 space-y-3 sm:mb-10 sm:space-y-4">
                  <p className="text-lg text-gray-700 sm:text-xl md:text-2xl dark:text-gray-300">
                    <span className="font-semibold">{t('You speak:')}</span>{' '}
                    <span className="text-violet-600 dark:text-violet-400">
                      {userLangInfo.nativeName} {userLangInfo.flag}
                    </span>
                  </p>
                  <p className="text-lg text-gray-700 sm:text-xl md:text-2xl dark:text-gray-300">
                    <span className="font-semibold">{t('Learning:')}</span>{' '}
                    <span className="text-violet-600 dark:text-violet-400">
                      {getSelectedRegionInfo()?.label} {targetLangInfo.name} {targetLangInfo.flag}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                  <button
                    onClick={handleStartLearning}
                    className="transform rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition duration-300 hover:scale-105 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl sm:px-12 sm:py-4 sm:text-lg"
                    aria-label="Start learning with flashcards"
                  >
                    {t('Start Flashcards')}
                  </button>
                  <button
                    onClick={handleReset}
                    className="rounded-full bg-gray-200 px-8 py-3 text-base font-semibold text-gray-800 shadow-lg transition duration-300 hover:bg-gray-300 hover:shadow-xl sm:px-12 sm:py-4 sm:text-lg dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                    aria-label="Start over"
                  >
                    {t('Change Region')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-600 sm:mt-12 sm:text-base lg:mt-16 dark:text-gray-400">
          <p>{t('Master the language and culture of your chosen region')}</p>
        </footer>
      </div>
    </div>
  );
}

export default Landing;
