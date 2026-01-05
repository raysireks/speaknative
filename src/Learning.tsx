import { useState } from 'react';

interface LearningProps {
  language: string;
  locale: string;
  onBack: () => void;
}

interface Phrase {
  text: string;
  translation: string;
  pronunciation?: string;
}

const learningContent: Record<string, Record<string, Phrase[]>> = {
  english: {
    'us-midwest': [
      {
        text: 'Hello',
        translation: 'A common greeting',
        pronunciation: 'heh-LOH',
      },
      {
        text: 'How are you?',
        translation: "Asking about someone's wellbeing",
        pronunciation: 'how AR yoo',
      },
      {
        text: 'Nice to meet you',
        translation: 'Polite greeting when meeting someone new',
        pronunciation: 'NYS too MEET yoo',
      },
    ],
    'us-eastcoast': [
      {
        text: 'Hey there',
        translation: 'Casual greeting',
        pronunciation: 'hay THAIR',
      },
      {
        text: "What's up?",
        translation: 'Informal way to ask how someone is doing',
        pronunciation: 'wuts UP',
      },
      {
        text: 'Good to see you',
        translation: 'Friendly greeting for someone you know',
        pronunciation: 'good too SEE yoo',
      },
    ],
  },
  spanish: {
    'co-cartagena': [
      {
        text: '¿Qué más?',
        translation: "What's up? (Cartagena style)",
        pronunciation: 'keh mahs',
      },
      {
        text: 'Bien o qué',
        translation: 'How are you? (Coastal slang)',
        pronunciation: 'bee-EHN oh keh',
      },
      {
        text: 'Mucho gusto',
        translation: 'Nice to meet you',
        pronunciation: 'MOO-cho GOOS-toh',
      },
    ],
    'co-medellin': [
      {
        text: '¿Quiubo parce?',
        translation: "What's up, buddy? (Medellín slang)",
        pronunciation: 'kee-OO-boh PAR-seh',
      },
      {
        text: '¿Bien o no?',
        translation: 'Good or not? (Common in Medellín)',
        pronunciation: 'bee-EHN oh noh',
      },
      {
        text: 'Un placer',
        translation: 'A pleasure (to meet you)',
        pronunciation: 'oon plah-SEHR',
      },
    ],
  },
};

function Learning({ language, locale, onBack }: LearningProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  const phrases = learningContent[language]?.[locale] || [];
  const currentPhrase = phrases[currentIndex];

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

  const toggleTranslation = () => {
    setShowTranslation(!showTranslation);
  };

  if (!currentPhrase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 p-4 sm:p-6 lg:p-8 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
        <div className="w-full max-w-3xl rounded-2xl bg-white p-8 text-center shadow-2xl sm:rounded-3xl sm:p-10 lg:p-16 dark:bg-gray-800">
          <p className="mb-6 text-xl text-gray-700 dark:text-gray-300">
            No learning content available for this selection.
          </p>
          <button
            onClick={onBack}
            className="transform rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition duration-300 hover:scale-105 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl sm:px-12 sm:py-4 sm:text-lg"
            aria-label="Go back"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-blue-50 p-4 sm:p-6 lg:p-8 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <header className="mb-6 text-center sm:mb-8">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-base font-medium text-violet-600 hover:text-violet-700 sm:text-lg dark:text-violet-400 dark:hover:text-violet-300"
              aria-label="Back to home"
            >
              <span className="text-xl sm:text-2xl">←</span> Back
            </button>
            <div className="text-sm text-gray-600 sm:text-base dark:text-gray-400">
              {currentIndex + 1} / {phrases.length}
            </div>
          </div>
          <h1 className="mb-2 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl md:text-5xl dark:from-violet-400 dark:to-purple-400">
            Learning {language.charAt(0).toUpperCase() + language.slice(1)}
          </h1>
          <p className="text-base text-gray-700 sm:text-lg dark:text-gray-300">
            Practice common phrases
          </p>
        </header>

        {/* Main Learning Card */}
        <main>
          <div className="mb-6 rounded-2xl bg-white p-8 shadow-2xl sm:rounded-3xl sm:p-10 lg:p-12 dark:bg-gray-800">
            <div className="mb-8 text-center">
              <div className="mb-6 text-4xl font-bold text-gray-800 sm:text-5xl md:text-6xl dark:text-white">
                {currentPhrase.text}
              </div>

              {currentPhrase.pronunciation && (
                <div className="mb-6 text-lg font-medium text-violet-600 sm:text-xl dark:text-violet-400">
                  [{currentPhrase.pronunciation}]
                </div>
              )}

              <button
                onClick={toggleTranslation}
                className="rounded-full bg-violet-100 px-8 py-3 text-base font-semibold text-violet-700 transition duration-300 hover:bg-violet-200 sm:text-lg dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
                aria-label={showTranslation ? 'Hide translation' : 'Show translation'}
              >
                {showTranslation ? 'Hide' : 'Show'} Translation
              </button>
            </div>

            {showTranslation && (
              <div className="animate-in fade-in rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 p-6 text-center duration-300 dark:from-violet-900/20 dark:to-purple-900/20">
                <p className="text-lg text-gray-700 sm:text-xl dark:text-gray-300">
                  {currentPhrase.translation}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="max-w-xs flex-1 transform rounded-full bg-white px-6 py-3 text-base font-semibold text-gray-700 shadow-lg transition duration-300 hover:scale-105 hover:bg-gray-50 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:px-8 sm:py-4 sm:text-lg dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Previous phrase"
            >
              ← Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === phrases.length - 1}
              className="max-w-xs flex-1 transform rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition duration-300 hover:scale-105 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:px-8 sm:py-4 sm:text-lg"
              aria-label="Next phrase"
            >
              Next →
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-600 sm:text-base dark:text-gray-400">
          <p>Practice and learn at your own pace</p>
        </footer>
      </div>
    </div>
  );
}

export default Learning;
