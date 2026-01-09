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
  selectedTargetLocale: string | null;
  onSelectTargetLocale: (locale: string) => void;
  onStartFlashcards?: (targetLocale: string, userLocale: SupportedLocale) => void;
  onStartVerbs?: (targetLocale: string, userLocale: SupportedLocale) => void;
  onStartReview?: (
    targetLocale: string,
    userLocale: SupportedLocale,
    mode: 'audio-only' | 'speaker'
  ) => void;
}

function Landing({
  selectedTargetLocale,
  onSelectTargetLocale,
  onStartFlashcards,
  onStartVerbs,
  onStartReview,
}: LandingProps) {
  const { locale: userLocale, setLocale: setUserLocale, t } = useLocale();

  // Get the language to LEARN (opposite of user's language)
  const targetLanguage = userLocale === 'en' ? 'es' : 'en';
  const availableRegions = LEARNING_REGIONS[targetLanguage];
  const targetLangInfo = LANGUAGE_INFO[targetLanguage];
  const userLangInfo = LANGUAGE_INFO[userLocale];

  const handleRegionSelect = (locale: string) => {
    onSelectTargetLocale(locale);
  };

  const handleReset = () => {
    onSelectTargetLocale(''); // Empty string acts as null in App state logic if string, or null if Typed.
    // App.tsx uses string state, but Landing types it as Locale (string|null).
    // Let's enforce string path.
    // App.tsx: `const [selectedTargetLocale, setSelectedTargetLocale] = useState<string>('');`
  };

  const handleStartLearning = () => {
    if (selectedTargetLocale && onStartFlashcards) {
      onStartFlashcards(selectedTargetLocale, userLocale);
    }
  };

  const handleStartVerbs = () => {
    if (selectedTargetLocale && onStartVerbs) {
      onStartVerbs(selectedTargetLocale, userLocale);
    }
  };

  const getSelectedRegionInfo = () => {
    return availableRegions.find((l) => l.value === selectedTargetLocale);
  };

  const toggleUserLocale = () => {
    setUserLocale(userLocale === 'en' ? 'es' : 'en');
    onSelectTargetLocale(''); // Reset selection when changing language
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl">
        {/* User Language Toggle - Minimal pill */}
        <div className="absolute top-6 right-6">
          <button
            onClick={toggleUserLocale}
            className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-300 backdrop-blur transition-colors hover:border-slate-700 hover:bg-slate-800"
            aria-label="Toggle language"
          >
            <span className="text-lg">{userLangInfo.flag}</span>
            <span>{userLangInfo.nativeName}</span>
          </button>
        </div>

        {/* Header - Clean and corporate */}
        <header className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
            {t('SpeakNative')}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            {t('Learn')} {targetLangInfo.name} {targetLangInfo.flag}
          </p>
        </header>

        {/* Main Content */}
        <main className="w-full">
          {!selectedTargetLocale ? (
            /* Region Selection - Grid of clean cards */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="mb-8 text-center text-xl font-medium text-slate-200">
                {t('Choose a region to learn')}
              </h2>
              <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
                {availableRegions.map((region) => (
                  <button
                    key={region.value}
                    onClick={() => handleRegionSelect(region.value)}
                    className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-8 text-left transition-all duration-300 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <div className="mb-6 text-5xl opacity-80 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-100">
                      {region.flag}
                    </div>
                    <h3 className="mb-2 text-2xl font-semibold text-slate-50">
                      {region.label}
                    </h3>
                    <p className="text-slate-400">
                      {region.description}
                    </p>
                    <div className="mt-6 flex items-center text-sm font-medium text-indigo-400 transition-colors group-hover:text-indigo-300">
                      {targetLangInfo.flag} {targetLangInfo.name}
                      <span className="ml-2 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Selection Complete - Dashboard view */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mx-auto max-w-5xl">
                {/* Header Status Bar */}
                <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row md:items-end">
                  <div className="text-center md:text-left">
                    <div className="mb-2 text-6xl">
                      {getSelectedRegionInfo()?.flag}
                    </div>
                    <h2 className="text-3xl font-bold text-slate-50">
                      {t('Ready to Learn!')}
                    </h2>
                  </div>

                  <div className="flex gap-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{t('You speak')}</div>
                      <div className="mt-1 flex items-center gap-2 text-lg font-medium text-slate-200">
                        {userLangInfo.nativeName} {userLangInfo.flag}
                      </div>
                    </div>
                    <div className="w-px bg-slate-800"></div>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{t('Learning')}</div>
                      <div className="mt-1 flex items-center gap-2 text-lg font-medium text-indigo-400">
                        {getSelectedRegionInfo()?.label} {targetLangInfo.flag}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Start Flashcards */}
                  <button
                    onClick={handleStartLearning}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:border-violet-500/50 hover:bg-slate-800"
                  >
                    <div>
                      <div className="mb-4 inline-flex rounded-lg bg-violet-500/10 p-3 text-2xl text-violet-400">🗂️</div>
                      <h3 className="mb-1 text-lg font-semibold text-slate-100">{t('Flashcards')}</h3>
                      <p className="text-sm text-slate-400">
                        {t('Learn phrases with interactive flashcards')}
                      </p>
                    </div>
                    <div className="mt-4 h-1 w-12 rounded bg-slate-800 transition-all duration-300 group-hover:w-full group-hover:bg-violet-500"></div>
                  </button>

                  {/* Start Verbs */}
                  <button
                    onClick={handleStartVerbs}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:border-blue-500/50 hover:bg-slate-800"
                  >
                    <div>
                      <div className="mb-4 inline-flex rounded-lg bg-blue-500/10 p-3 text-2xl text-blue-400">📚</div>
                      <h3 className="mb-1 text-lg font-semibold text-slate-100">{t('Verbs')}</h3>
                      <p className="text-sm text-slate-400">
                        {t('Master verb conjugations and usage')}
                      </p>
                    </div>
                    <div className="mt-4 h-1 w-12 rounded bg-slate-800 transition-all duration-300 group-hover:w-full group-hover:bg-blue-500"></div>
                  </button>

                  {/* Audio Challenge */}
                  <button
                    onClick={() => onStartReview?.(selectedTargetLocale, userLocale, 'audio-only')}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-800"
                  >
                    <div>
                      <div className="mb-4 inline-flex rounded-lg bg-emerald-500/10 p-3 text-2xl text-emerald-400">👂</div>
                      <h3 className="mb-1 text-lg font-semibold text-slate-100">{t('Listening')}</h3>
                      <p className="text-sm text-slate-400">
                        {t('Listen and guess the meaning')}
                      </p>
                    </div>
                    <div className="mt-4 h-1 w-12 rounded bg-slate-800 transition-all duration-300 group-hover:w-full group-hover:bg-emerald-500"></div>
                  </button>

                  {/* Translation Challenge */}
                  <button
                    onClick={() => onStartReview?.(selectedTargetLocale, userLocale, 'speaker')}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:border-pink-500/50 hover:bg-slate-800"
                  >
                    <div>
                      <div className="mb-4 inline-flex rounded-lg bg-pink-500/10 p-3 text-2xl text-pink-400">🗣️</div>
                      <h3 className="mb-1 text-lg font-semibold text-slate-100">
                        {t('Speaking')}
                      </h3>
                      <p className="text-sm text-slate-400">{t('Translate and speak aloud')}</p>
                    </div>
                    <div className="mt-4 h-1 w-12 rounded bg-slate-800 transition-all duration-300 group-hover:w-full group-hover:bg-pink-500"></div>
                  </button>
                </div>

                {/* Back Link */}
                <div className="mt-12 text-center">
                  <button
                    onClick={handleReset}
                    className="text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {t('← Choose a different region')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Landing;
