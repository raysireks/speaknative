import type { FlashcardItem } from '../Flashcards';

interface ReviewCardProps {
  phrase: FlashcardItem;
  mode: 'audio-only' | 'speaker';
  revealed: boolean;
  onReveal: () => void;
  onPlayAudio: () => void;
  regionName: string;
  userLocale: string;
}

export function ReviewCard({
  phrase,
  mode,
  revealed,
  onReveal,
  onPlayAudio,
  regionName,
  userLocale,
}: ReviewCardProps) {
  if (mode === 'audio-only') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {!revealed ? (
          <div className="flex flex-col items-center gap-8">
            <button
              onClick={onPlayAudio}
              className="group flex h-32 w-32 items-center justify-center rounded-full border border-slate-700 bg-slate-800/50 transition-all duration-300 hover:scale-110 hover:bg-slate-800 hover:border-indigo-500/50"
              aria-label="Play audio to guess"
            >
              <span className="text-6xl text-indigo-400 transition-transform duration-300 group-hover:scale-110">
                🔊
              </span>
            </button>
            <p className="text-lg font-medium text-slate-400">
              Listen and guess the phrase
            </p>
            <button
              onClick={onReveal}
              className="w-full rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition duration-300 hover:bg-indigo-500 hover:shadow-indigo-500/20"
            >
              Reveal {userLocale === 'en' ? '🇺🇸' : userLocale === 'es' ? '🇪🇸' : '🌐'}
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in w-full space-y-8 duration-300">
            {/* Target Phrase (Revealed) */}
            <div>
              <p className="mb-2 text-sm font-medium tracking-wide text-slate-500 uppercase">
                Phrase
              </p>
              <h2 className="text-4xl font-bold text-slate-50 sm:text-5xl">
                {phrase.phraseToLearn}
              </h2>
            </div>

            {/* Slang (if any) */}
            {phrase.slangToLearn && (
              <div>
                <span className="mb-2 inline-block rounded-full bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-xs font-bold text-pink-400 tracking-wider">
                  {regionName} SLANG
                </span>
                <p className="text-2xl font-semibold text-pink-400 sm:text-3xl">
                  {phrase.slangToLearn}
                </p>
              </div>
            )}

            <div className="my-6 border-t border-slate-800" />

            {/* User Translation (Revealed) */}
            <div>
              <p className="mb-2 text-sm font-medium tracking-wide text-slate-500 uppercase">
                Translation
              </p>
              <h3 className="text-3xl font-bold text-emerald-400 sm:text-4xl">
                {phrase.phraseInUserLang}
              </h3>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Speaker Mode
  // Show User Translation -> Reveal Target Phrase & Audio
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      {/* User Translation (Always Visible) */}
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium tracking-wide text-slate-500 uppercase">
          Translate this
        </p>
        <h3 className="text-3xl font-bold text-slate-50 sm:text-5xl">
          {phrase.phraseInUserLang}
        </h3>
      </div>

      {!revealed ? (
        <div className="w-full">
          <button
            onClick={onReveal}
            className="w-full rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition duration-300 hover:bg-indigo-500 hover:shadow-indigo-500/20"
          >
            Reveal {userLocale === 'en' ? '🇺🇸' : userLocale === 'es' ? '🇪🇸' : '🌐'}
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in w-full space-y-8 duration-300">
          <div className="my-6 border-t border-slate-800" />

          {/* Target Phrase (Revealed) */}
          <div>
            <p className="mb-2 text-sm font-medium tracking-wide text-slate-500 uppercase">
              Answer
            </p>
            <h2 className="text-4xl font-bold text-emerald-400 sm:text-5xl">
              {phrase.phraseToLearn}
            </h2>
          </div>

          {/* Slang (if any) */}
          {phrase.slangToLearn && (
            <div>
              <span className="mb-2 inline-block rounded-full bg-pink-500/10 border border-pink-500/20 px-3 py-1 text-xs font-bold text-pink-400 tracking-wider">
                {regionName} SLANG
              </span>
              <p className="text-2xl font-semibold text-pink-400 sm:text-3xl">
                {phrase.slangToLearn}
              </p>
            </div>
          )}

          {/* Audio Button (Revealed) */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onPlayAudio}
              className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-6 py-3 font-semibold text-indigo-400 transition duration-300 hover:bg-slate-800 hover:text-indigo-300"
              aria-label="Play audio"
            >
              <span className="text-2xl">🔊</span>
              Listen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
