import { useState, useMemo } from 'react';
import { useLocale } from '../context/LocaleContext';
import { getPhrasesForLocale, type Phrase } from '../data/phrase-adapter';
import type { SupportedLocale } from '../data/locales';
import { shuffleArray } from '../utils/array';
import { ReviewCard } from './ReviewCard';
import type { FlashcardItem } from '../Flashcards';

interface ReviewSessionProps {
  targetLocale: string;
  userLocale: SupportedLocale;
  onBack: () => void;
  initialMode?: 'audio-only' | 'speaker';
}

type ReviewMode = 'selection' | 'audio-only' | 'speaker';

const REGION_NAMES: Record<string, string> = {
  'co-cartagena': 'Cartagena',
  'co-medellin': 'Medellín',
  'us-eastcoast': 'East Coast',
  'us-midwest': 'Midwest',
};

export function ReviewSession({
  targetLocale,
  userLocale,
  onBack,
  initialMode,
}: ReviewSessionProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<ReviewMode>(initialMode || 'selection');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const regionName = REGION_NAMES[targetLocale] || targetLocale;
  const userLangLocale = userLocale === 'en' ? 'us' : 'co';

  // Fetch and shuffle phrases (same as Flashcards)
  const phrases = useMemo(() => {
    const raw = getPhrasesForLocale(targetLocale, userLangLocale);
    const items: FlashcardItem[] = [];

    raw.forEach((p: Phrase) => {
      if (p.text) {
        items.push({
          id: p.id,
          phraseToLearn: p.text,
          phraseInUserLang: p.translation,
          slangToLearn: p.slangText,
        });
      }
    });

    return shuffleArray(items);
  }, [targetLocale, userLangLocale]);

  const handleStartMode = (selectedMode: ReviewMode) => {
    setMode(selectedMode);
    setCurrentIndex(0);
    setRevealed(false);
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

  const handlePlayAudio = () => {
    alert(t('🔊 Audio playback coming soon!'));
  };

  // 1. Mode Selection Screen
  if (mode === 'selection') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 p-4 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
        <div className="w-full max-w-4xl">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <span className="text-2xl">←</span> {t('Back')}
          </button>

          <div className="rounded-3xl bg-white p-8 text-center shadow-2xl sm:p-12 dark:bg-gray-800">
            <h1 className="mb-4 text-3xl font-bold text-gray-800 sm:text-4xl dark:text-white">
              {t('Review Session')}
            </h1>
            <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">
              {t('Choose how you want to review your phrases')}
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Audio Only Mode */}
              <button
                onClick={() => handleStartMode('audio-only')}
                className="group relative overflow-hidden rounded-2xl bg-violet-50 p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-violet-900/20"
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-violet-100 transition-transform duration-500 group-hover:scale-150 dark:bg-violet-800/30" />
                <span className="relative z-10 mb-4 block text-4xl">👂</span>
                <h3 className="relative z-10 mb-2 text-2xl font-bold text-gray-800 dark:text-white">
                  {t('Audio Challenge')}
                </h3>
                <p className="relative z-10 text-gray-600 dark:text-gray-300">
                  {t('Listen to the phrase and guess what it means.')}
                </p>
              </button>

              {/* Speaker Mode */}
              <button
                onClick={() => handleStartMode('speaker')}
                className="group relative overflow-hidden rounded-2xl bg-fuchsia-50 p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-fuchsia-900/20"
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-fuchsia-100 transition-transform duration-500 group-hover:scale-150 dark:bg-fuchsia-800/30" />
                <span className="relative z-10 mb-4 block text-4xl">🗣️</span>
                <h3 className="relative z-10 mb-2 text-2xl font-bold text-gray-800 dark:text-white">
                  {t('Translation Challenge')}
                </h3>
                <p className="relative z-10 text-gray-600 dark:text-gray-300">
                  {t('Read the phrase in your language and say it in the target language.')}
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Review Session (Card View)
  const currentPhrase = phrases[currentIndex];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 p-4 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setMode('selection')}
            className="flex items-center gap-2 font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <span className="text-2xl">←</span> {t('Change Mode')}
          </button>
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            {currentIndex + 1} / {phrases.length}
          </div>
        </div>

        {/* Card */}
        <div className="flex min-h-[500px] flex-col rounded-3xl bg-white p-8 shadow-2xl sm:p-12 dark:bg-gray-800">
          <ReviewCard
            phrase={currentPhrase}
            mode={mode as 'audio-only' | 'speaker'}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onPlayAudio={handlePlayAudio}
            regionName={regionName}
            userLocale={userLocale}
          />

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
