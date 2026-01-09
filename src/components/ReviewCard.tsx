import type { FlashcardItem } from '../Flashcards';

interface ReviewCardProps {
  phrase: FlashcardItem;
  mode: 'audio-only' | 'speaker';
  revealed: boolean;
  onReveal: () => void;
  onPlayAudio: () => void;
  regionName: string;
  userLocale: 'en' | 'es';
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
              className="group flex h-32 w-32 items-center justify-center rounded-full bg-corporate-surface border border-corporate-border transition-all duration-200 hover:bg-corporate-surface-hover"
              aria-label="Play audio to guess"
            >
              <span className="text-6xl transition-transform duration-200 group-hover:scale-110">
                🔊
              </span>
            </button>
            <p className="text-lg font-medium text-corporate-text-tertiary">
              Listen and guess the phrase
            </p>
            <button
              onClick={onReveal}
              className="w-full rounded-corporate bg-corporate-accent-primary px-8 py-4 text-lg font-semibold text-white shadow-corporate transition duration-200 hover:bg-corporate-accent-hover"
            >
              Reveal {userLocale === 'en' ? '🇺🇸' : '🇪🇸'}
            </button>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in w-full space-y-8 duration-300">
            {/* Target Phrase (Revealed) */}
            <div>
              <p className="mb-2 text-sm font-medium tracking-wide text-corporate-text-tertiary uppercase">
                Phrase
              </p>
              <h2 className="text-4xl font-bold text-corporate-text-primary sm:text-5xl">
                {phrase.phraseToLearn}
              </h2>
            </div>

            {/* Slang (if any) */}
            {phrase.slangToLearn && (
              <div>
                <span className="mb-2 inline-block rounded-corporate bg-corporate-accent-primary px-3 py-1 text-xs font-bold text-white">
                  {regionName} SLANG
                </span>
                <p className="text-2xl font-semibold text-corporate-accent-secondary sm:text-3xl">
                  {phrase.slangToLearn}
                </p>
              </div>
            )}

            <div className="my-6 border-t border-corporate-border" />

            {/* User Translation (Revealed) */}
            <div>
              <p className="mb-2 text-sm font-medium tracking-wide text-corporate-text-tertiary uppercase">
                Translation
              </p>
              <h3 className="text-3xl font-bold text-corporate-success sm:text-4xl">
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
        <p className="mb-2 text-sm font-medium tracking-wide text-corporate-text-tertiary uppercase">
          Translate this
        </p>
        <h3 className="text-3xl font-bold text-corporate-text-primary sm:text-5xl">
          {phrase.phraseInUserLang}
        </h3>
      </div>

      {!revealed ? (
        <div className="w-full">
          <button
            onClick={onReveal}
            className="w-full rounded-corporate bg-corporate-accent-primary px-8 py-4 text-lg font-semibold text-white shadow-corporate transition duration-200 hover:bg-corporate-accent-hover"
          >
            Reveal {userLocale === 'en' ? '🇺🇸' : '🇪🇸'}
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in w-full space-y-8 duration-300">
          <div className="my-6 border-t border-corporate-border" />

          {/* Target Phrase (Revealed) */}
          <div>
            <p className="mb-2 text-sm font-medium tracking-wide text-corporate-text-tertiary uppercase">
              Answer
            </p>
            <h2 className="text-4xl font-bold text-corporate-success sm:text-5xl">
              {phrase.phraseToLearn}
            </h2>
          </div>

          {/* Slang (if any) */}
          {phrase.slangToLearn && (
            <div>
              <span className="mb-2 inline-block rounded-corporate bg-corporate-accent-primary px-3 py-1 text-xs font-bold text-white">
                {regionName} SLANG
              </span>
              <p className="text-2xl font-semibold text-corporate-accent-secondary sm:text-3xl">
                {phrase.slangToLearn}
              </p>
            </div>
          )}

          {/* Audio Button (Revealed) */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onPlayAudio}
              className="flex items-center gap-2 rounded-corporate bg-corporate-surface border border-corporate-border px-6 py-3 font-semibold text-corporate-accent-secondary transition duration-200 hover:bg-corporate-surface-hover hover:text-corporate-accent-primary"
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
