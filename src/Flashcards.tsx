import { useState, useMemo } from 'react';
import { getPhrasesForLocale } from './data/phrases';

interface FlashcardsProps {
  locale: string;
  onBack: () => void;
}

function Flashcards({ locale, onBack }: FlashcardsProps) {
  const [includeSlang, setIncludeSlang] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  const localeData = getPhrasesForLocale(locale);

  const phrases = useMemo(() => {
    if (!localeData) return [];
    return includeSlang ? localeData.phrases : localeData.phrases.filter((p) => !p.isSlang);
  }, [localeData, includeSlang]);

  const handleStart = () => {
    setCurrentIndex(0);
    setShowTranslation(false);
    setStarted(true);
  };

  const handleNext = () => {
    if (currentIndex < phrases.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowTranslation(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowTranslation(false);
    }
  };

  const handleFlip = () => {
    setShowTranslation(!showTranslation);
  };

  const handlePlayAudio = () => {
    // Audio placeholder - would integrate with text-to-speech API
    alert('Audio playback would play here');
  };

  if (!localeData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 p-4 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-white">Invalid Locale</h2>
          <button
            onClick={onBack}
            className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3 font-semibold text-white transition duration-300 hover:from-violet-700 hover:to-purple-700"
          >
            Go Back
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
            <span className="text-2xl">←</span> Back
          </button>

          <div className="rounded-3xl bg-white p-8 shadow-2xl sm:p-12 dark:bg-gray-800">
            <h1 className="mb-6 text-center text-3xl font-bold text-gray-800 sm:text-4xl dark:text-white">
              Flashcards Settings
            </h1>

            <div className="mb-8 space-y-6">
              <div>
                <p className="mb-2 text-lg text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Learning Locale:</span>{' '}
                  <span className="text-violet-600 capitalize dark:text-violet-400">
                    {localeData.locale.replace('-', ' - ')}
                  </span>
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Total Phrases:</span> 100
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                <label className="flex cursor-pointer items-center gap-4">
                  <input
                    type="checkbox"
                    checked={includeSlang}
                    onChange={(e) => setIncludeSlang(e.target.checked)}
                    className="h-6 w-6 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <span className="text-lg font-semibold text-gray-800 dark:text-white">
                      Include Slang
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mix in 30 Gen Z & Millennial slang phrases from the last 5 years
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full transform rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition duration-300 hover:scale-105 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl"
            >
              Start Flashcards
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
            <span className="text-2xl">←</span> Settings
          </button>
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            {currentIndex + 1} / {phrases.length}
          </div>
        </div>

        <div className="flex min-h-[400px] flex-col justify-between rounded-3xl bg-white p-8 shadow-2xl sm:p-12 dark:bg-gray-800">
          {currentPhrase.isSlang && (
            <div className="mb-4">
              <span className="inline-block rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1 text-xs font-bold text-white">
                SLANG
              </span>
            </div>
          )}

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-8">
              <h2 className="mb-4 text-4xl font-bold text-gray-800 sm:text-5xl dark:text-white">
                {showTranslation ? currentPhrase.translation : currentPhrase.text}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {showTranslation ? 'Translation' : 'Phrase'}
              </p>
            </div>

            <button
              onClick={handlePlayAudio}
              className="flex items-center gap-2 rounded-full bg-violet-100 px-6 py-3 font-semibold text-violet-600 transition duration-300 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50"
              aria-label="Play audio"
            >
              <span className="text-2xl">🔊</span>
              Play Audio
            </button>
          </div>

          <div className="mt-8">
            <button
              onClick={handleFlip}
              className="mb-4 w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition duration-300 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl"
            >
              {showTranslation ? 'Show Phrase' : 'Show Translation'}
            </button>

            <div className="flex gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex-1 rounded-full bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition duration-300 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === phrases.length - 1}
                className="flex-1 rounded-full bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition duration-300 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Flashcards;
