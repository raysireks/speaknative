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
    userLocale
}: ReviewCardProps) {
    if (mode === 'audio-only') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
                {!revealed ? (
                    <div className="flex flex-col items-center gap-8">
                        <button
                            onClick={onPlayAudio}
                            className="group flex h-32 w-32 items-center justify-center rounded-full bg-violet-100 transition-all duration-300 hover:scale-110 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50"
                            aria-label="Play audio to guess"
                        >
                            <span className="text-6xl transition-transform duration-300 group-hover:scale-110">🔊</span>
                        </button>
                        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                            Listen and guess the phrase
                        </p>
                        <button
                            onClick={onReveal}
                            className="w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition duration-300 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl"
                        >
                            Reveal {userLocale === 'en' ? '🇺🇸' : '🇪🇸'}
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in duration-300 space-y-8 w-full">
                        {/* Target Phrase (Revealed) */}
                        <div>
                            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Phrase
                            </p>
                            <h2 className="text-4xl font-bold text-gray-800 sm:text-5xl dark:text-white">
                                {phrase.phraseToLearn}
                            </h2>
                        </div>

                        {/* Slang (if any) */}
                        {phrase.slangToLearn && (
                            <div>
                                <span className="inline-block rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1 text-xs font-bold text-white mb-2">
                                    {regionName} SLANG
                                </span>
                                <p className="text-2xl text-purple-600 font-semibold sm:text-3xl dark:text-purple-400">
                                    {phrase.slangToLearn}
                                </p>
                            </div>
                        )}

                        <div className="my-6 border-t border-gray-200 dark:border-gray-700" />

                        {/* User Translation (Revealed) */}
                        <div>
                            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Translation
                            </p>
                            <h3 className="text-3xl font-bold text-green-600 sm:text-4xl dark:text-green-400">
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
        <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* User Translation (Always Visible) */}
            <div className="mb-8">
                <p className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Translate this
                </p>
                <h3 className="text-3xl font-bold text-gray-800 sm:text-5xl dark:text-white">
                    {phrase.phraseInUserLang}
                </h3>
            </div>

            {!revealed ? (
                <div className="w-full">
                    <button
                        onClick={onReveal}
                        className="w-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition duration-300 hover:from-violet-700 hover:to-purple-700 hover:shadow-xl"
                    >
                        Reveal {userLocale === 'en' ? '🇺🇸' : '🇪🇸'}
                    </button>
                </div>
            ) : (
                <div className="animate-in fade-in zoom-in duration-300 space-y-8 w-full">
                    <div className="my-6 border-t border-gray-200 dark:border-gray-700" />

                    {/* Target Phrase (Revealed) */}
                    <div>
                        <p className="mb-2 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            Answer
                        </p>
                        <h2 className="text-4xl font-bold text-green-600 sm:text-5xl dark:text-green-400">
                            {phrase.phraseToLearn}
                        </h2>
                    </div>

                    {/* Slang (if any) */}
                    {phrase.slangToLearn && (
                        <div>
                            <span className="inline-block rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-3 py-1 text-xs font-bold text-white mb-2">
                                {regionName} SLANG
                            </span>
                            <p className="text-2xl text-purple-600 font-semibold sm:text-3xl dark:text-purple-400">
                                {phrase.slangToLearn}
                            </p>
                        </div>
                    )}

                    {/* Audio Button (Revealed) */}
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={onPlayAudio}
                            className="flex items-center gap-2 rounded-full bg-violet-100 px-6 py-3 font-semibold text-violet-600 transition duration-300 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50"
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
