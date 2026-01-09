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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl sm:rounded-3xl sm:p-10 lg:p-16">
          <p className="mb-6 text-xl text-slate-300">
            No learning content available for this selection.
          </p>
          <button
            onClick={onBack}
            className="transform rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/20 sm:px-12 sm:py-4 sm:text-lg"
            aria-label="Go back"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <header className="mb-6 text-center sm:mb-8">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-base font-medium text-slate-400 hover:text-slate-200 sm:text-lg"
              aria-label="Back to home"
            >
              <span className="text-xl sm:text-2xl">←</span> Back
            </button>
            <div className="rounded-full bg-slate-900 border border-slate-800 px-4 py-1 text-sm font-medium text-slate-400">
              {currentIndex + 1} / {phrases.length}
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-slate-50 sm:text-4xl md:text-5xl">
            Learning {language.charAt(0).toUpperCase() + language.slice(1)}
          </h1>
          <p className="text-base text-slate-400 sm:text-lg">
            Practice common phrases
          </p>
        </header>

        {/* Main Learning Card */}
        <main>
          <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl sm:p-10 lg:p-12">
            <div className="mb-8 text-center">
              <div className="mb-6 text-4xl font-bold text-slate-50 sm:text-5xl md:text-6xl">
                {currentPhrase.text}
              </div>

              {currentPhrase.pronunciation && (
                <div className="mb-6 text-lg font-medium text-violet-400 sm:text-xl">
                  [{currentPhrase.pronunciation}]
                </div>
              )}

              <button
                onClick={toggleTranslation}
                className="rounded-full bg-slate-800 border border-slate-700 px-8 py-3 text-base font-semibold text-indigo-400 transition duration-200 hover:bg-slate-700 hover:text-indigo-300 sm:text-lg"
                aria-label={showTranslation ? 'Hide translation' : 'Show translation'}
              >
                {showTranslation ? 'Hide' : 'Show'} Translation
              </button>
            </div>

            {showTranslation && (
              <div className="animate-in fade-in rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center duration-300">
                <p className="text-lg text-slate-300 sm:text-xl">
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
              className="max-w-xs flex-1 transform rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-base font-semibold text-slate-300 shadow-lg transition duration-200 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-8 sm:py-4 sm:text-lg"
              aria-label="Previous phrase"
            >
              ← Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === phrases.length - 1}
              className="max-w-xs flex-1 transform rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:px-8 sm:py-4 sm:text-lg"
              aria-label="Next phrase"
            >
              Next →
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Learning;
