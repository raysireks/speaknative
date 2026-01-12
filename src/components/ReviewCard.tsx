import { useState } from 'react';
import type { FlashcardItem } from '../Flashcards';

interface ReviewCardProps {
  phrase: FlashcardItem;
  mode: 'audio-only' | 'speaker';
  onPlayAudio: () => void;
  regionName: string;
}

export function ReviewCard({
  phrase,
  mode,
  onPlayAudio,
  regionName,
}: ReviewCardProps) {
  const [variantIndex, setVariantIndex] = useState(0);

  const handleNextVariant = () => {
    if (phrase.variants && variantIndex < phrase.variants.length - 1) {
      setVariantIndex(variantIndex + 1);
    }
  };

  const handlePrevVariant = () => {
    if (variantIndex > 0) {
      setVariantIndex(variantIndex - 1);
    }
  };

  const isAudioOnly = mode === 'audio-only';

  return (
    <div className="flex flex-1 flex-col items-center justify-start text-center w-full">
      {/* Top Section: Target Variations */}
      <div className="flex-1 w-full space-y-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <p className="text-xs font-bold tracking-[0.2em] text-indigo-500/80 uppercase">
            {regionName} {phrase.isSlang ? 'Slang' : 'Variations'}
          </p>
        </div>

        <div className="relative flex flex-col items-center w-full min-h-[280px] justify-center px-4">
          {phrase.variants && phrase.variants.length > 0 ? (
            <>
              {/* Phrases Content Area */}
              {(() => {
                const safeIdx = Math.min(variantIndex, phrase.variants.length - 1);
                const v = phrase.variants[safeIdx];
                const text = v?.text || phrase.phraseToLearn;

                // Dynamic font size logic (slightly smaller for ReviewCard which is usually more compact)
                let fontSizeClass = 'text-3xl sm:text-4xl lg:text-5xl';
                if (text.length < 15) {
                  fontSizeClass = 'text-4xl sm:text-5xl lg:text-6xl';
                } else if (text.length > 40) {
                  fontSizeClass = 'text-xl sm:text-2xl lg:text-3xl';
                }

                return (
                  <div className="flex-1 w-full flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className={`font-bold text-slate-50 text-center leading-tight mb-4 ${fontSizeClass}`}>
                      {text}
                    </h2>

                    <div className="mb-6 flex items-center justify-center gap-2">
                      {v?.score !== undefined && (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400/80 tracking-widest uppercase">
                          {Math.round(v.score * 100)}% MATCH
                        </span>
                      )}
                      {v?.is_slang && (
                        <span className="rounded-full bg-pink-500/10 px-2.5 py-0.5 text-[10px] font-bold text-pink-400/80 tracking-widest uppercase">
                          SLANG
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Navigation Controls (Below Word) */}
              <div className="flex flex-col items-center gap-4 mt-2">
                <div className="flex items-center gap-6">
                  {/* Left Arrow */}
                  <button
                    onClick={handlePrevVariant}
                    disabled={variantIndex === 0}
                    className="p-2.5 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    aria-label="Previous variation"
                  >
                    <span className="text-lg">←</span>
                  </button>

                  {/* Pagination Dots */}
                  {phrase.variants.length > 1 && (
                    <div className="flex gap-2">
                      {phrase.variants.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${idx === variantIndex ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-800'
                            }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Right Arrow */}
                  <button
                    onClick={handleNextVariant}
                    disabled={variantIndex >= (phrase.variants.length - 1)}
                    className="p-2.5 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700/80 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    aria-label="Next variation"
                  >
                    <span className="text-lg">→</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-10 rounded-2xl bg-slate-800/10 border border-slate-800/50 text-center">
              <h2 className="text-3xl font-bold text-slate-50 opacity-40 italic mb-4">
                {phrase.phraseToLearn}
              </h2>
            </div>
          )}
        </div>
      </div>

      {/* Audio controls */}
      <div className="my-8 flex justify-center w-full">
        {isAudioOnly ? (
          <button
            onClick={onPlayAudio}
            className="group flex h-24 w-24 items-center justify-center rounded-full border border-slate-700 bg-slate-800/50 transition-all duration-300 hover:scale-105 hover:bg-indigo-600 hover:border-indigo-500"
            aria-label="Play audio"
          >
            <span className="text-4xl text-indigo-400 transition-colors group-hover:text-white">
              🔊
            </span>
          </button>
        ) : (
          <button
            onClick={onPlayAudio}
            className="group flex items-center gap-3 rounded-full border border-slate-700 bg-slate-800/50 px-8 py-3.5 font-bold text-indigo-400 transition-all duration-300 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white"
            aria-label="Play audio"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🔊</span>
            Listen
          </button>
        )}
      </div>

      <div className="w-full h-px bg-slate-800/80 mb-8 relative">
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-4 text-[10px] font-bold text-slate-600 tracking-[0.2em] uppercase">
          Meaning
        </span>
      </div>

      {/* Bottom Section: Meaning (User Lang) */}
      <div className="w-full text-center pb-4">
        <div className="animate-in fade-in zoom-in duration-700">
          <h3 className="text-3xl font-bold text-emerald-400 sm:text-5xl tracking-tight">
            {phrase.phraseInUserLang}
          </h3>
        </div>
      </div>
    </div>
  );
}
