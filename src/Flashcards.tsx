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
  const [revealed, setRevealed] = useState(false);
  const [phrases, setPhrases] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [variantIndex, setVariantIndex] = useState(0);

  useEffect(() => {
    setVariantIndex(0);
  }, [currentIndex]);



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

  const handlePrevVariant = () => {
    const current = phrases[currentIndex];
    if (current?.variants && variantIndex > 0) {
      setVariantIndex(variantIndex - 1);
    }
  };

  const handleNextVariant = () => {
    const current = phrases[currentIndex];
    if (current?.variants && variantIndex < current.variants.length - 1) {
      setVariantIndex(variantIndex + 1);
    }
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
          {/* Top Section (Target Language) */}
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-8 w-full">
              <div className="flex items-center justify-center gap-2 mb-4">
                <p className="text-sm font-medium tracking-widest text-slate-500 uppercase">
                  {t('Phrase to learn')}
                </p>
              </div>

              {/* Variant Cycling Logic on Front (Target Lang) */}
              {currentPhrase.variants && currentPhrase.variants.length > 1 ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex w-full items-center justify-between gap-4">
                    {/* Left Nav */}
                    <button
                      onClick={handlePrevVariant}
                      disabled={variantIndex === 0}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>

                    {/* Variant Content */}
                    <div className="flex flex-col items-center flex-1">
                      <h2 className="text-4xl font-bold text-slate-50 sm:text-5xl lg:text-6xl px-2">
                        {currentPhrase.variants[variantIndex].text}
                      </h2>
                      <div className="mt-4 flex items-center gap-2 justify-center">
                        {currentPhrase.variants[variantIndex].score !== undefined && (
                          <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 tracking-wider">
                            {Math.round(currentPhrase.variants[variantIndex].score! * 100)}% MATCH
                          </span>
                        )}
                        {currentPhrase.variants[variantIndex].is_slang && (
                          <span className="rounded bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 text-[10px] font-bold text-pink-400 tracking-wider">
                            {t('SLANG')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Nav */}
                    <button
                      onClick={handleNextVariant}
                      disabled={variantIndex === currentPhrase.variants.length - 1}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </div>
                  {/* Counter */}
                  <div className="mt-2 text-xs font-medium text-slate-500 font-mono bg-slate-900/50 px-2 py-1 rounded">
                    {variantIndex + 1} / {currentPhrase.variants.length}
                  </div>
                </div>
              ) : (
                /* Single Variant Case */
                <div className="flex flex-col items-center">
                  <h2 className="text-4xl font-bold text-slate-50 sm:text-5xl lg:text-6xl">
                    {currentPhrase.phraseToLearn}
                  </h2>
                  {currentPhrase.isSlang && (
                    <div className="mt-4">
                      <span className="rounded bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 text-[10px] font-bold text-pink-400 tracking-wider">
                        {t('SLANG')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Audio Button */}
            <button
              onClick={handlePlayAudio}
              className="group flex items-center gap-3 rounded-full border border-slate-700 bg-slate-800/50 px-6 py-3 font-semibold text-indigo-400 transition duration-200 hover:bg-slate-800 hover:border-indigo-500/50 hover:text-indigo-300"
              aria-label="Play audio"
            >
              <span className="text-xl opacity-70 group-hover:opacity-100">🔊</span>
              {t('Listen')}
            </button>
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-slate-800"></div>

          {/* Reveal Section (Source Language) */}
          <div className="text-center">
            {!revealed ? (
              <button
                onClick={handleReveal}
                className="w-full rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-sm transition duration-200 hover:bg-indigo-500 hover:shadow-md"
              >
                {t('Reveal')} {userLocale === 'en' ? '🇺🇸' : '🇪🇸'}
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="mb-3 text-sm font-medium tracking-widest text-slate-500 uppercase">
                  {t('Your language')}
                </p>
                <h3 className="text-3xl font-bold text-emerald-400 sm:text-4xl">
                  {currentPhrase.phraseInUserLang}
                </h3>
              </div>
            )}
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
