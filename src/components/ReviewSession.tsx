import { useState, useEffect } from 'react';
import { useLocale } from '../context/useLocale';
import { getDynamicPhrases, type Phrase } from '../data/phrase-adapter';
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
  const mode = initialMode || 'selection';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phrases, setPhrases] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);

  const regionName = REGION_NAMES[targetLocale] || targetLocale;
  const userLangLocale = userLocale === 'en' ? 'us' : 'co';

  useEffect(() => {
    async function fetchPhrases() {
      setLoading(true);
      try {
        const dynamic = await getDynamicPhrases(targetLocale, userLocale);
        const items: FlashcardItem[] = [];
        const sourceData = dynamic;

        sourceData.forEach((p: Phrase) => {
          if (p.text) {
            items.push({
              id: p.id,
              phraseToLearn: p.text,
              phraseInUserLang: p.translation,
              slangToLearn: p.slangText,
              variants: p.variants,
            });
          }
        });

        setPhrases(shuffleArray(items));
      } catch (error) {
        console.error('Failed to fetch phrases:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPhrases();
  }, [targetLocale, userLangLocale, userLocale]);

  const handleNext = () => {
    if (currentIndex < phrases.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handlePlayAudio = () => {
    alert(t('🔊 Audio playback coming soon!'));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-slate-400">Loading review session...</p>
        </div>
      </div>
    );
  }

  if (phrases.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-slate-50">
            {t('No Phrases Available')}
          </h2>
          <button
            onClick={onBack}
            className="rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white transition duration-200 hover:bg-indigo-500"
          >
            {t('Go Back')}
          </button>
        </div>
      </div>
    );
  }

  const currentPhrase = phrases[currentIndex];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-medium text-slate-400 hover:text-slate-200"
          >
            <span className="text-2xl">←</span> {t('Back')}
          </button>
          <div className="rounded-full bg-slate-900 border border-slate-800 px-4 py-1 text-sm font-medium text-slate-400">
            {currentIndex + 1} / {phrases.length}
          </div>
        </div>

        {/* Card */}
        <div className="flex min-h-[500px] flex-col rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl sm:p-12">
          <ReviewCard
            phrase={currentPhrase}
            mode={mode as 'audio-only' | 'speaker'}
            onPlayAudio={handlePlayAudio}
            regionName={regionName}
          />

          {/* Navigation */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 font-semibold text-slate-300 transition duration-300 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('← Previous')}
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === phrases.length - 1}
              className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition duration-300 hover:bg-indigo-500 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('Next →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
