import { useState, useMemo } from 'react';
import { useLocale } from './context/LocaleContext';
import { getPhrasesForLocale, type Phrase } from './data/phrase-adapter';
import type { SupportedLocale } from './data/locales';
import { shuffleArray } from './utils/array';

interface FlashcardsProps {
  targetLocale: string;  // The locale to learn (e.g., 'co-cartagena' or 'us-eastcoast')
  userLocale: SupportedLocale;  // User's native language ('en' or 'es')
  onBack: () => void;
}

interface FlashcardItem {
  id: number;
  phraseToLearn: string;      // The phrase in the language being learned
  phraseInUserLang: string;   // The phrase in user's native language
  slangToLearn?: string;      // Regional slang in the language being learned
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
          phraseToLearn: p.text,          // Target language phrase
          phraseInUserLang: p.translation, // User's language translation
          slangToLearn: p.slangText,       // Regional slang in target language
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 p-4 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">
            {t('No Phrases Available')}
          </h2>
          <button
            onClick={onBack}
            className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3 font-semibold text-white transition duration-300 hover:from-violet-700 hover:to-purple-700"
          >
            {t('Go Back')}
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 p-4 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
        <div className="w-full max-w-2xl">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <span className="text-2xl">←</span> {t('Back')}
          </button>

          <div className="rounded-3xl bg-white p-8 shadow-2xl sm:p-12 dark:bg-gray-800">
            <h1 className="mb-6 text-center text-3xl font-bold text-gray-800 sm:text-4xl dark:text-white">
              {t('Flashcard Settings')}
            </h1>

            <div className="mb-8 space-y-6">
              <div className="rounded-2xl bg-violet-50 p-6 dark:bg-violet-900/20">
                <p className="mb-2 text-lg text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{t('Region:')}</span>{' '}
                  <span className="text-violet-600 dark:text-violet-400">
                    {regionName}
                  </span>
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{t('Phrases:')}</span>{' '}
                  <span className="text-violet-600 dark:text-violet-400">
                    {phrases.length}
                  </span>
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">
                  {t('Each flashcard shows a phrase to learn. Tap reveal to see it in your language.')}
                </p>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full transform rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition duration-300 hover:scale-105 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl"
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 p-4 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setStarted(false)}
            className="flex items-center gap-2 font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <span className="text-2xl">←</span> {t('Settings')}
          </button>
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            {currentIndex + 1} / {phrases.length}
          </div>
        </div>

        <div className="flex min-h-[500px] flex-col rounded-3xl bg-white p-8 shadow-2xl sm:p-12 dark:bg-gray-800">
          {/* Phrase to Learn */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="mb-6">
              <p className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t('Phrase to learn')}
              </p>
              <h2 className="text-4xl font-bold text-gray-800 sm:text-5xl lg:text-6xl dark:text-white">
                {currentPhrase.phraseToLearn}
              </h2>
            </div>

            {/* Regional Slang (if available) */}
            {currentPhrase.slangToLearn && (
              <div className="mb-6">
                <span className="inline-block rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1 text-xs font-bold text-white mb-2">
                  {regionName} {t('SLANG')}
                </span>
                <p className="text-2xl text-purple-600 font-semibold sm:text-3xl dark:text-purple-400">
                  {currentPhrase.slangToLearn}
                </p>
              </div>
            )}

            {/* Audio Button */}
            <button
              onClick={handlePlayAudio}
              className="flex items-center gap-2 rounded-full bg-violet-100 px-6 py-3 font-semibold text-violet-600 transition duration-300 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50"
              aria-label="Play audio"
            >
              <span className="text-2xl">🔊</span>
              {t('Listen')}
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200 dark:border-gray-700"></div>

          {/* Reveal Section */}
          <div className="text-center">
            {!revealed ? (
              <button
                onClick={handleReveal}
                className="w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition duration-300 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl"
              >
                {t('Reveal')} {userLocale === 'en' ? '🇺🇸' : '🇪🇸'}
              </button>
            ) : (
              <div className="animate-in fade-in duration-300">
                <p className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t('Your language')}
                </p>
                <h3 className="text-3xl font-bold text-green-600 sm:text-4xl dark:text-green-400">
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
              className="flex-1 rounded-full bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition duration-300 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              {t('← Previous')}
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === phrases.length - 1}
              className="flex-1 rounded-full bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition duration-300 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
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
