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
  onStartVerbs?: (targetLocale: string, userLocale: SupportedLocale) => void;
  onStartReview?: (
    targetLocale: string,
    userLocale: SupportedLocale,
    mode: 'audio-only' | 'speaker'
  ) => void;
}

function Landing({ onStartFlashcards, onStartVerbs, onStartReview }: LandingProps) {
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
    setSelectedTargetLocale(null); // Reset selection when changing language
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-corporate-bg-primary p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl">
        {/* User Language Toggle - "I speak..." */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-corporate-text-secondary sm:inline">
              {t('I speak:')}
            </span>
            <button
              onClick={toggleUserLocale}
              className="flex items-center gap-2 rounded-corporate bg-corporate-surface-elevated px-4 py-2 font-medium border border-corporate-border shadow-corporate transition-all duration-200 hover:bg-corporate-surface-hover hover:border-corporate-border-light"
              aria-label="Toggle my language"
            >
              <span className="text-xl">{userLangInfo.flag}</span>
              <span className="text-corporate-text-primary">{userLangInfo.nativeName}</span>
            </button>
          </div>
        </div>

        {/* Header */}
        <header className="mb-8 text-center sm:mb-12 lg:mb-16">
          <h1 className="mb-3 text-4xl font-bold text-corporate-text-primary sm:mb-4 sm:text-5xl md:text-6xl lg:text-7xl">
            {t('SpeakNative')}
          </h1>
          <p className="text-lg text-corporate-text-secondary sm:text-xl md:text-2xl">
            {t('Learn')} {targetLangInfo.name} {targetLangInfo.flag}
          </p>
        </header>

        {/* Main Content */}
        <main className="w-full">
          {!selectedTargetLocale ? (
            /* Region Selection */
            <div className="animate-in fade-in duration-500">
              <h2 className="mb-6 text-center text-2xl font-semibold text-corporate-text-primary sm:mb-8 sm:text-3xl md:text-4xl lg:mb-12">
                {t('Choose a region to learn')}
              </h2>
              <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 sm:gap-6 lg:gap-8">
                {availableRegions.map((region) => (
                  <button
                    key={region.value}
                    onClick={() => handleRegionSelect(region.value)}
                    className="group relative transform overflow-hidden rounded-corporate-lg bg-corporate-surface-elevated border border-corporate-border p-8 shadow-corporate transition-all duration-200 hover:bg-corporate-surface-hover hover:border-corporate-border-light sm:p-10 lg:p-12"
                    aria-label={`Select ${region.label}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-corporate-accent-primary/5 to-corporate-accent-secondary/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
                    <div className="relative z-10">
                      <div className="mb-4 text-5xl sm:mb-6 sm:text-6xl lg:text-7xl">
                        {region.flag}
                      </div>
                      <h3 className="mb-2 text-2xl font-bold text-corporate-text-primary sm:text-3xl lg:text-4xl">
                        {region.label}
                      </h3>
                      <p className="text-base text-corporate-text-secondary sm:text-lg">
                        {region.description}
                      </p>
                      <div className="mt-4 text-sm font-medium text-corporate-accent-secondary">
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
              <div className="mx-auto max-w-3xl rounded-corporate-lg bg-corporate-surface-elevated border border-corporate-border p-8 text-center shadow-corporate-lg sm:p-10 lg:p-16">
                <div className="mb-6 text-6xl sm:mb-8 sm:text-7xl lg:text-8xl">
                  {getSelectedRegionInfo()?.flag}
                </div>
                <h2 className="mb-4 text-3xl font-bold text-corporate-text-primary sm:mb-6 sm:text-4xl md:text-5xl">
                  {t('Ready to Learn!')}
                </h2>
                <div className="mb-8 space-y-3 sm:mb-10 sm:space-y-4">
                  <p className="text-lg text-corporate-text-secondary sm:text-xl md:text-2xl">
                    <span className="font-semibold">{t('You speak:')}</span>{' '}
                    <span className="text-corporate-accent-secondary">
                      {userLangInfo.nativeName} {userLangInfo.flag}
                    </span>
                  </p>
                  <p className="text-lg text-corporate-text-secondary sm:text-xl md:text-2xl">
                    <span className="font-semibold">{t('Learning:')}</span>{' '}
                    <span className="text-corporate-accent-secondary">
                      {getSelectedRegionInfo()?.label} {targetLangInfo.name} {targetLangInfo.flag}
                    </span>
                  </p>
                </div>
                {/* Learning Options Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Start Flashcards */}
                  <button
                    onClick={handleStartLearning}
                    className="group relative overflow-hidden rounded-corporate bg-corporate-surface p-6 text-left border border-corporate-border shadow-corporate transition-all duration-200 hover:bg-corporate-surface-hover hover:border-corporate-border-light"
                    aria-label="Start learning with flashcards"
                  >
                    <div className="absolute inset-0 bg-corporate-accent-primary/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    <div className="relative z-10">
                      <div className="mb-3 text-4xl">🗂️</div>
                      <h3 className="mb-2 text-xl font-bold text-corporate-text-primary">{t('Start Flashcards')}</h3>
                      <p className="text-sm text-corporate-text-tertiary">
                        {t('Learn phrases with interactive flashcards')}
                      </p>
                    </div>
                  </button>

                  {/* Start Verbs */}
                  <button
                    onClick={handleStartVerbs}
                    className="group relative overflow-hidden rounded-corporate bg-corporate-surface p-6 text-left border border-corporate-border shadow-corporate transition-all duration-200 hover:bg-corporate-surface-hover hover:border-corporate-border-light"
                    aria-label="Start learning verbs"
                  >
                    <div className="absolute inset-0 bg-corporate-accent-primary/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    <div className="relative z-10">
                      <div className="mb-3 text-4xl">📚</div>
                      <h3 className="mb-2 text-xl font-bold text-corporate-text-primary">{t('Start Verbs')}</h3>
                      <p className="text-sm text-corporate-text-tertiary">
                        {t('Master verb conjugations and usage')}
                      </p>
                    </div>
                  </button>

                  {/* Audio Challenge */}
                  <button
                    onClick={() => onStartReview?.(selectedTargetLocale, userLocale, 'audio-only')}
                    className="group relative overflow-hidden rounded-corporate bg-corporate-surface p-6 text-left border border-corporate-border shadow-corporate transition-all duration-200 hover:bg-corporate-surface-hover hover:border-corporate-border-light"
                    aria-label="Start audio challenge"
                  >
                    <div className="absolute inset-0 bg-corporate-accent-primary/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    <div className="relative z-10">
                      <div className="mb-3 text-4xl">👂</div>
                      <h3 className="mb-2 text-xl font-bold text-corporate-text-primary">{t('Audio Challenge')}</h3>
                      <p className="text-sm text-corporate-text-tertiary">
                        {t('Listen and guess the meaning')}
                      </p>
                    </div>
                  </button>

                  {/* Translation Challenge */}
                  <button
                    onClick={() => onStartReview?.(selectedTargetLocale, userLocale, 'speaker')}
                    className="group relative overflow-hidden rounded-corporate bg-corporate-surface p-6 text-left border border-corporate-border shadow-corporate transition-all duration-200 hover:bg-corporate-surface-hover hover:border-corporate-border-light"
                    aria-label="Start translation challenge"
                  >
                    <div className="absolute inset-0 bg-corporate-accent-primary/5 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    <div className="relative z-10">
                      <div className="mb-3 text-4xl">🗣️</div>
                      <h3 className="mb-2 text-xl font-bold text-corporate-text-primary">
                        {t('Translation Challenge')}
                      </h3>
                      <p className="text-sm text-corporate-text-tertiary">{t('Translate and speak aloud')}</p>
                    </div>
                  </button>
                </div>

                {/* Back to Region Selection */}
                <div className="mt-6 text-center">
                  <button
                    onClick={handleReset}
                    className="text-sm font-medium text-corporate-text-tertiary underline decoration-dotted underline-offset-4 transition-colors duration-200 hover:text-corporate-text-secondary"
                    aria-label="Choose a different region"
                  >
                    {t('← Choose a different region')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-corporate-text-tertiary sm:mt-12 sm:text-base lg:mt-16">
          <p>{t('Master the language and culture of your chosen region')}</p>
        </footer>
      </div>
    </div>
  );
}

export default Landing;
