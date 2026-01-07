import React, { useState, useEffect } from 'react';
import { getVerbsForLocale } from './data/verb-adapter';
import { shuffleArray } from './utils/array';

import { getText } from './data/locales';
import type { SupportedLocale } from './data/locales';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';

interface VerbNavigatorProps {
  sourceLocale: string; // e.g. 'co-cartagena' (Native)
  targetLocale: string; // e.g. 'us-ca' (Learning)
  userLocale: SupportedLocale;
  onBack: () => void;
}

type Tense = 'present' | 'past' | 'future';
type Person = '1s' | '2s' | '3s' | '1p' | '3p';

const PERSON_LABELS: Record<Person, string> = {
  '1s': 'I / Yo',
  '2s': 'You / Tú',
  '3s': 'He/She / Él/Ella',
  '1p': 'We / Nosotros',
  '3p': 'They / Ellos',
};

// Keys match UI_TEXT in locales.ts
const TENSE_KEYS: Record<Tense, string> = {
  present: 'Present',
  past: 'Past',
  future: 'Future',
};

export const VerbNavigator: React.FC<VerbNavigatorProps> = ({
  sourceLocale,
  targetLocale,
  userLocale,
  onBack,
}) => {
  // Derived state for verbs (avoids sync setState in useEffect)
  const verbs = React.useMemo(() => {
    return shuffleArray(getVerbsForLocale(sourceLocale, targetLocale));
  }, [sourceLocale, targetLocale]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Persisted state across verbs
  const [currentTense, setCurrentTense] = useState<Tense>('present');
  const [currentPerson, setCurrentPerson] = useState<Person>('1s');

  // Navigation handlers
  const nextVerb = React.useCallback(() => {
    if (verbs.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % verbs.length);
  }, [verbs.length]);

  const prevVerb = React.useCallback(() => {
    if (verbs.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + verbs.length) % verbs.length);
  }, [verbs.length]);

  const nextTense = () => {
    const tenses: Tense[] = ['present', 'past', 'future'];
    const idx = tenses.indexOf(currentTense);
    setCurrentTense(tenses[(idx + 1) % tenses.length]);
  };

  const nextPerson = () => {
    const persons: Person[] = ['1s', '2s', '3s', '1p', '3p'];
    const idx = persons.indexOf(currentPerson);
    setCurrentPerson(persons[(idx + 1) % persons.length]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextVerb();
      if (e.key === 'ArrowLeft') prevVerb();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextVerb, prevVerb]);
  const t = (key: string) => getText(key, userLocale);

  if (verbs.length === 0)
    return <div className="p-8 text-center text-white/50">{t('Loading verbs...')}</div>;

  const verb = verbs[currentIndex];
  const targetConjugation = verb.conjugation?.[currentTense]?.[currentPerson] || '...';
  const nativeConjugation = verb.translationConjugation?.[currentTense]?.[currentPerson] || '...';

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-md flex-col p-6 duration-500">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="-ml-2 rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-sm font-medium tracking-wider text-white/40 uppercase">
          {t('Top 50 Verbs')} • {currentIndex + 1} / {verbs.length}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Card */}
      <div className="perspective-container relative flex flex-1 flex-col items-center justify-center">
        <div className="group relative w-full overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/30">
          {/* Background Accent */}
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl transition-all duration-500 group-hover:bg-blue-500/30" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl transition-all duration-500 group-hover:bg-purple-500/30" />

          {/* Conjugation Display */}
          <div className="mb-6 rounded-2xl border border-white/5 bg-black/20 p-6 text-center backdrop-blur-sm">
            <div className="mb-2 text-xs font-bold tracking-widest text-white/40 uppercase">
              {t(TENSE_KEYS[currentTense])} • {PERSON_LABELS[currentPerson]}
            </div>
            <div className="mb-1 text-3xl font-medium text-white">{targetConjugation}</div>
            <div className="text-base text-white/50">{nativeConjugation}</div>
          </div>

          {/* Verb Infinitive */}
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-4xl font-bold text-white drop-shadow-sm">{verb.infinitive}</h2>
            <p className="text-lg text-white/60">{verb.translation}</p>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={nextTense}
              className="group/btn flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 active:bg-white/15"
            >
              <div className="text-left">
                <div className="text-[10px] tracking-wider text-white/40 uppercase">
                  {t('Tense')}
                </div>
                <div className="font-medium text-white">{t(TENSE_KEYS[currentTense])}</div>
              </div>
              <ChevronRight
                size={16}
                className="text-white/30 transition-colors group-hover/btn:text-white/70"
              />
            </button>

            <button
              onClick={nextPerson}
              className="group/btn flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 active:bg-white/15"
            >
              <div className="text-left">
                <div className="text-[10px] tracking-wider text-white/40 uppercase">
                  {t('Person')}
                </div>
                <div className="max-w-[80px] truncate font-medium text-white">
                  {PERSON_LABELS[currentPerson].split(' / ')[0]}
                </div>
              </div>
              <ChevronRight
                size={16}
                className="text-white/30 transition-colors group-hover/btn:text-white/70"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          onClick={prevVerb}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 p-4 font-medium text-white transition-all hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft size={18} />
          {t('Prev Verb')}
        </button>
        <button
          onClick={nextVerb}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white p-4 font-bold text-black shadow-lg transition-all hover:scale-[1.02] hover:shadow-white/20 active:scale-95"
        >
          {t('Next Verb')}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
