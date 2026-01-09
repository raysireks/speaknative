import { useState, useMemo } from 'react';
import { useLocale } from './context/LocaleContext';
import { getPhrasesForLocale, type Phrase } from './data/phrase-adapter';
import type { SupportedLocale } from './data/locales';
import { shuffleArray } from './utils/array';

interface FlashcardsProps {
  targetLocale: string; // The locale to learn (e.g., 'co-cartagena' or 'us-eastcoast')
  userLocale: SupportedLocale; // User's native language ('en' or 'es')
  onBack: () => void;
}

export interface FlashcardItem {
  id: number;
  phraseToLearn: string; // The phrase in the language being learned
  phraseInUserLang: string; // The phrase in user's native language
  slangToLearn?: string; // Regional slang in the language being learned
}

const REGION_NAMES: Record<string, string> = {
  'co-cartagena': 'Cartagena',
  'co-medellin': 'Medellín',
  'us-eastcoast': 'East Coast',
  'us-midwest': 'Midwest',
};

function Flashcards({ targetLocale, userLocale, onBack }: FlashcardsProps) {
  const { t } = useLocale();
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const regionName = REGION_NAMES[targetLocale] || targetLocale;

  // Determine which locale provides the user's language
  const userLangLocale = userLocale === 'en' ? 'us' : 'co';

  // Get phrases: target (what they're learning) and user's language (for reveal)
  const phrases = useMemo(() => {
    // Get phrases with targetLocale as source, user's language as target
    const raw = getPhrasesForLocale(targetLocale, userLangLocale);
    const items: FlashcardItem[] = [];

    raw.forEach((p: Phrase) => {
      if (p.text) {
        items.push({
          id: p.id,
          phraseToLearn: p.text, // Target language phrase
          phraseInUserLang: p.translation, // User's language translation
          slangToLearn: p.slangText, // Regional slang in target language
        });
      }
    });

    return shuffleArray(items);
  }, [targetLocale, userLangLocale]);

  const handleStart = () => {
    setCurrentIndex(0);
    setRevealed(false);
    setStarted(true);
  };

  const handleNext = () => {
    if (currentIndex < phrases.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setRevealed(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setRevealed(false);
    }
  };

  const handleReveal = () => {
    setRevealed(true);
  };

  const handlePlayAudio = () => {
    alert(t('🔊 Audio playback coming soon!'));
  };

  if (phrases.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-corporate-bg-primary p-4">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-corporate-text-primary">
            {t('No Phrases Available')}
          </h2>
          <button
            onClick={onBack}
            className="rounded-corporate bg-corporate-accent-primary px-8 py-3 font-semibold text-white transition duration-200 hover:bg-corporate-accent-hover"
          >
            {t('Go Back')}
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-corporate-bg-primary p-4">
        <div className="w-full max-w-2xl">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 font-medium text-corporate-accent-secondary hover:text-corporate-accent-primary transition-colors"
          >
            <span className="text-2xl">←</span> {t('Back')}
          </button>

          <div className="rounded-corporate-lg bg-corporate-surface-elevated border border-corporate-border p-8 shadow-corporate-lg sm:p-12">
            <h1 className="mb-6 text-center text-3xl font-bold text-corporate-text-primary sm:text-4xl">
              {t('Flashcard Settings')}
            </h1>

            <div className="mb-8 space-y-6">
              <div className="rounded-corporate bg-corporate-surface p-6 border border-corporate-border">
                <p className="mb-2 text-lg text-corporate-text-secondary">
                  <span className="font-semibold">{t('Region:')}</span>{' '}
                  <span className="text-corporate-accent-secondary">{regionName}</span>
                </p>
                <p className="text-lg text-corporate-text-secondary">
                  <span className="font-semibold">{t('Phrases:')}</span>{' '}
                  <span className="text-corporate-accent-secondary">{phrases.length}</span>
                </p>
              </div>

              <div className="border-t border-corporate-border pt-6">
                <p className="text-corporate-text-tertiary">
                  {t(
                    'Each flashcard shows a phrase to learn. Tap reveal to see it in your language.'
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full transform rounded-corporate bg-corporate-accent-primary px-8 py-4 text-lg font-semibold text-white shadow-corporate transition duration-200 hover:bg-corporate-accent-hover"
            >
              {t('Start Learning')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentPhrase = phrases[currentIndex];

  return (
    <div className="flex min-h-screen items-center justify-center bg-corporate-bg-primary p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setStarted(false)}
            className="flex items-center gap-2 font-medium text-corporate-accent-secondary hover:text-corporate-accent-primary transition-colors"
          >
            <span className="text-2xl">←</span> {t('Settings')}
          </button>
          <div className="font-semibold text-corporate-text-secondary">
            {currentIndex + 1} / {phrases.length}
          </div>
        </div>

        <div className="flex min-h-[500px] flex-col rounded-corporate-lg bg-corporate-surface-elevated border border-corporate-border p-8 shadow-corporate-lg sm:p-12">
          {/* Phrase to Learn */}
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6">
              <p className="mb-2 text-sm font-medium tracking-wide text-corporate-text-tertiary uppercase">
                {t('Phrase to learn')}
              </p>
              <h2 className="text-4xl font-bold text-corporate-text-primary sm:text-5xl lg:text-6xl">
                {currentPhrase.phraseToLearn}
              </h2>
            </div>

            {/* Regional Slang (if available) */}
            {currentPhrase.slangToLearn && (
              <div className="mb-6">
                <span className="mb-2 inline-block rounded-corporate bg-corporate-accent-primary px-3 py-1 text-xs font-bold text-white">
                  {regionName} {t('SLANG')}
                </span>
                <p className="text-2xl font-semibold text-corporate-accent-secondary sm:text-3xl">
                  {currentPhrase.slangToLearn}
                </p>
              </div>
            )}

            {/* Audio Button */}
            <button
              onClick={handlePlayAudio}
              className="flex items-center gap-2 rounded-corporate bg-corporate-surface px-6 py-3 font-semibold text-corporate-accent-secondary border border-corporate-border transition duration-200 hover:bg-corporate-surface-hover hover:text-corporate-accent-primary"
              aria-label="Play audio"
            >
              <span className="text-2xl">🔊</span>
              {t('Listen')}
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-corporate-border"></div>

          {/* Reveal Section */}
          <div className="text-center">
            {!revealed ? (
              <button
                onClick={handleReveal}
                className="w-full rounded-corporate bg-corporate-accent-primary px-8 py-4 text-lg font-semibold text-white shadow-corporate transition duration-200 hover:bg-corporate-accent-hover"
              >
                {t('Reveal')} {userLocale === 'en' ? '🇺🇸' : '🇪🇸'}
              </button>
            ) : (
              <div className="animate-in fade-in duration-300">
                <p className="mb-2 text-sm font-medium tracking-wide text-corporate-text-tertiary uppercase">
                  {t('Your language')}
                </p>
                <h3 className="text-3xl font-bold text-corporate-success sm:text-4xl">
                  {currentPhrase.phraseInUserLang}
                </h3>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-1 rounded-corporate bg-corporate-surface border border-corporate-border px-6 py-3 font-semibold text-corporate-text-primary transition duration-200 hover:bg-corporate-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('← Previous')}
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === phrases.length - 1}
              className="flex-1 rounded-corporate bg-corporate-surface border border-corporate-border px-6 py-3 font-semibold text-corporate-text-primary transition duration-200 hover:bg-corporate-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('Next →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Flashcards;
