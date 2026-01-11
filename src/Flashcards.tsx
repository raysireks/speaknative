import { useState, useEffect } from 'react';
import { useLocale } from './context/useLocale';
import { getDynamicPhrases, type Phrase } from './data/phrase-adapter';
import type { SupportedLocale } from './data/locales';
import { shuffleArray } from './utils/array';

interface FlashcardsProps {
  targetLocale: string; // The locale to learn (e.g., 'co-cartagena' or 'us-eastcoast')
  userLocale: SupportedLocale; // User's native language ('en' or 'es')
  onBack: () => void;
}

export interface FlashcardItem {
  id: number | string;
  phraseToLearn: string; // The phrase in the language being learned
  phraseInUserLang: string; // The phrase in user's native language
  slangToLearn?: string; // Regional slang in the language being learned
  isSlang?: boolean; // Is the main phrase itself slang?
  variants?: { text: string; is_slang: boolean; score?: number }[];
}



function Flashcards({ targetLocale, userLocale, onBack }: FlashcardsProps) {
  const { t } = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phrases, setPhrases] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);




  // Determine which locale provides the user's language
  const userLangLocale = userLocale === 'en' ? 'us' : 'co';

  useEffect(() => {
    async function fetchPhrases() {
      setLoading(true);
      try {
        // Try to get dynamic phrases from Firestore first
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
              isSlang: p.is_slang,
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
          <p className="text-slate-400">Loading translations...</p>
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span className="text-xl">←</span> {t('Back')}
          </button>
          <div className="rounded-full bg-slate-900 border border-slate-800 px-4 py-1 text-sm font-medium text-slate-400">
            {currentIndex + 1} / {phrases.length}
          </div>
        </div>

        <div className="flex min-h-[500px] flex-col rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl sm:p-12">
          {/* Top Section (Target Language Variations) */}
          <div className="flex flex-1 flex-col items-center justify-start text-center overflow-hidden">
            <div className="mb-6 w-full">
              <div className="flex items-center justify-center gap-2 mb-6">
                <p className="text-xs font-bold tracking-[0.2em] text-indigo-500/80 uppercase">
                  {t('Variations to learn')}
                </p>
              </div>

              {/* All Variants Display */}
              <div className="flex flex-col gap-4 w-full max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {currentPhrase.variants && currentPhrase.variants.length > 0 ? (
                  currentPhrase.variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="group flex flex-col items-center p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300"
                    >
                      <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
                        {v.text}
                      </h2>
                      <div className="mt-3 flex items-center gap-2">
                        {v.score !== undefined && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400/80 tracking-wider uppercase">
                            {Math.round(v.score * 100)}% {t('Match')}
                          </span>
                        )}
                        {v.is_slang && (
                          <span className="rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-400/80 tracking-wider uppercase">
                            {t('Slang')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-800/20 border border-slate-700/30">
                    <h2 className="text-3xl font-bold text-slate-50 opacity-40 italic">
                      {currentPhrase.phraseToLearn}
                    </h2>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Button */}
            <div className="mt-auto pt-6">
              <button
                onClick={handlePlayAudio}
                className="group flex items-center gap-3 rounded-full border border-slate-700 bg-slate-800/50 px-8 py-3.5 font-bold text-indigo-400 transition-all duration-300 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white"
                aria-label="Play audio"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">🔊</span>
                {t('Listen')}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/80"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-900 px-4 text-xs font-bold text-slate-600 tracking-widest uppercase">
                {t('Meaning')}
              </span>
            </div>
          </div>

          {/* Bottom Section (Source Language - Always Visible) */}
          <div className="text-center pb-2">
            <div className="animate-in fade-in zoom-in duration-500">
              <h3 className="text-3xl font-bold text-emerald-400 sm:text-4xl lg:text-5xl tracking-tight">
                {currentPhrase.phraseInUserLang}
              </h3>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-10 flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-6 py-4 font-semibold text-slate-300 transition duration-200 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-800"
            >
              {t('← Previous')}
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === phrases.length - 1}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-6 py-4 font-semibold text-slate-300 transition duration-200 hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-800"
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
