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

        <div className="flex flex-col gap-4 w-full">
          {phrase.variants && phrase.variants.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-1 w-full max-h-[350px] overflow-y-auto no-scrollbar pb-4 px-2">
              {phrase.variants.map((v, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col items-center p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/30 transition-all duration-300 shadow-sm"
                >
                  <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
                    {v.text}
                  </h2>
                  <div className="mt-2.5 flex items-center gap-2">
                    {v.score !== undefined && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400/80 tracking-wider">
                        {Math.round(v.score * 100)}% MATCH
                      </span>
                    )}
                    {v.is_slang && (
                      <span className="rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-bold text-pink-400/80 tracking-wider">
                        SLANG
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-800/20 border border-slate-700/30">
              <h2 className="text-3xl font-bold text-slate-50 opacity-40 italic">
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
