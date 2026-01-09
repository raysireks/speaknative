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
      <div className="flex min-h-screen items-center justify-center bg-corporate-bg-primary p-4">
        <div className="w-full max-w-4xl">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 font-medium text-corporate-accent-secondary hover:text-corporate-accent-primary transition-colors"
          >
            <span className="text-2xl">←</span> {t('Back')}
          </button>

          <div className="rounded-corporate-lg bg-corporate-surface-elevated border border-corporate-border p-8 text-center shadow-corporate-lg sm:p-12">
            <h1 className="mb-4 text-3xl font-bold text-corporate-text-primary sm:text-4xl">
              {t('Review Session')}
            </h1>
            <p className="mb-8 text-xl text-corporate-text-secondary">
              {t('Choose how you want to review your phrases')}
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Audio Only Mode */}
              <button
                onClick={() => handleStartMode('audio-only')}
                className="group relative overflow-hidden rounded-corporate bg-corporate-surface border border-corporate-border p-8 text-left transition-all duration-200 hover:bg-corporate-surface-hover hover:border-corporate-border-light"
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-corporate-accent-primary/10 transition-transform duration-300 group-hover:scale-150" />
                <span className="relative z-10 mb-4 block text-4xl">👂</span>
                <h3 className="relative z-10 mb-2 text-2xl font-bold text-corporate-text-primary">
                  {t('Audio Challenge')}
                </h3>
                <p className="relative z-10 text-corporate-text-tertiary">
                  {t('Listen to the phrase and guess what it means.')}
                </p>
              </button>

              {/* Speaker Mode */}
              <button
                onClick={() => handleStartMode('speaker')}
                className="group relative overflow-hidden rounded-corporate bg-corporate-surface border border-corporate-border p-8 text-left transition-all duration-200 hover:bg-corporate-surface-hover hover:border-corporate-border-light"
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-corporate-accent-primary/10 transition-transform duration-300 group-hover:scale-150" />
                <span className="relative z-10 mb-4 block text-4xl">🗣️</span>
                <h3 className="relative z-10 mb-2 text-2xl font-bold text-corporate-text-primary">
                  {t('Translation Challenge')}
                </h3>
                <p className="relative z-10 text-corporate-text-tertiary">
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
    <div className="flex min-h-screen items-center justify-center bg-corporate-bg-primary p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setMode('selection')}
            className="flex items-center gap-2 font-medium text-corporate-accent-secondary hover:text-corporate-accent-primary transition-colors"
          >
            <span className="text-2xl">←</span> {t('Change Mode')}
          </button>
          <div className="font-semibold text-corporate-text-secondary">
            {currentIndex + 1} / {phrases.length}
          </div>
        </div>

        {/* Card */}
        <div className="flex min-h-[500px] flex-col rounded-corporate-lg bg-corporate-surface-elevated border border-corporate-border p-8 shadow-corporate-lg sm:p-12">
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
