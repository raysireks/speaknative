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

// Subject pronouns for Spanish
const SPANISH_SUBJECTS: Record<Person, string> = {
  '1s': 'Yo',
  '2s': 'Tú',
  '3s': 'Él/Ella',
  '1p': 'Nosotros',
  '3p': 'Ellos',
};

// Subject pronouns for English
const ENGLISH_SUBJECTS: Record<Person, string> = {
  '1s': 'I',
  '2s': 'You',
  '3s': 'He/She',
  '1p': 'We',
  '3p': 'They',
};

// Helper to get subject pronoun based on locale
function getSubjectPronoun(person: Person, locale: string): string {
  if (locale.startsWith('co-') || locale === 'es') {
    return SPANISH_SUBJECTS[person];
  }
  return ENGLISH_SUBJECTS[person];
}

// Sample sentence patterns for common verbs
const VERB_SENTENCE_PATTERNS: Record<string, { es: string; en: string }> = {
  ser: { es: '{subject} {verb} feliz', en: '{subject} {verb} happy' },
  estar: { es: '{subject} {verb} aquí', en: '{subject} {verb} here' },
  tener: { es: '{subject} {verb} tiempo', en: '{subject} {verb} time' },
  hacer: { es: '{subject} {verb} eso', en: '{subject} {verb} that' },
  ir: { es: '{subject} {verb} allá', en: '{subject} {verb} there' },
  dar: { es: '{subject} {verb} regalos', en: '{subject} {verb} gifts' },
  decir: { es: '{subject} {verb} hola', en: '{subject} {verb} hello' },
  poder: { es: '{subject} {verb} ayudar', en: '{subject} {verb} help' },
  saber: { es: '{subject} {verb} español', en: '{subject} {verb} Spanish' },
  querer: { es: '{subject} {verb} aprender', en: '{subject} {verb} to learn' },
  ver: { es: '{subject} {verb} televisión', en: '{subject} {verb} TV' },
  llegar: { es: '{subject} {verb} tarde', en: '{subject} {verb} late' },
  pasar: { es: '{subject} {verb} tiempo', en: '{subject} {verb} time' },
  deber: { es: '{subject} {verb} estudiar', en: '{subject} {verb} study' },
  poner: { es: '{subject} {verb} la mesa', en: '{subject} {verb} the table' },
  venir: { es: '{subject} {verb} pronto', en: '{subject} {verb} soon' },
  sentir: { es: '{subject} {verb} alegría', en: '{subject} {verb} joy' },
  salir: { es: '{subject} {verb} temprano', en: '{subject} {verb} early' },
  hablar: { es: '{subject} {verb} español', en: '{subject} {verb} Spanish' },
  encontrar: { es: '{subject} {verb} algo', en: '{subject} {verb} something' },
};

// Simple sample sentences for common verbs
function getSampleSentence(
  verbId: string,
  conjugation: string,
  subject: string,
  locale: string
): string {
  const isSpanish = locale.startsWith('co-') || locale === 'es';
  const pattern = VERB_SENTENCE_PATTERNS[verbId] || {
    es: '{subject} {verb}',
    en: '{subject} {verb}',
  };
  const template = isSpanish ? pattern.es : pattern.en;

  return template.replace('{subject}', subject).replace('{verb}', conjugation);
}

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

  // Get subject pronouns
  const targetSubject = getSubjectPronoun(currentPerson, targetLocale);
  const nativeSubject = getSubjectPronoun(currentPerson, sourceLocale);

  // Get sample sentences
  const targetSentence = getSampleSentence(verb.id, targetConjugation, targetSubject, targetLocale);
  const nativeSentence = getSampleSentence(verb.id, nativeConjugation, nativeSubject, sourceLocale);

  return (
    <div className="animate-in fade-in mx-auto flex h-full w-full max-w-md flex-col p-6 duration-500">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="-ml-2 rounded-full p-2 text-corporate-text-tertiary transition-colors hover:bg-corporate-surface hover:text-corporate-text-secondary"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-sm font-medium tracking-wider text-corporate-text-tertiary uppercase">
          {t('Top 50 Verbs')} • {currentIndex + 1} / {verbs.length}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Card */}
      <div className="perspective-container relative flex flex-1 flex-col items-center justify-center">
        <div className="group relative w-full overflow-hidden rounded-corporate-lg border border-corporate-border bg-corporate-surface-elevated p-8 shadow-corporate-lg backdrop-blur-xl transition-all duration-200 hover:border-corporate-border-light">
          {/* Background Accent */}
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-corporate-accent-primary/10 blur-3xl transition-all duration-300 group-hover:bg-corporate-accent-primary/20" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-corporate-accent-secondary/10 blur-3xl transition-all duration-300 group-hover:bg-corporate-accent-secondary/20" />

          {/* Verb Infinitive */}
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-4xl font-bold text-corporate-text-primary drop-shadow-sm">{verb.infinitive}</h2>
            <p className="text-lg text-corporate-text-tertiary">{verb.translation}</p>
          </div>

          {/* Controls */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              onClick={nextTense}
              className="group/btn flex items-center justify-between rounded-corporate border border-corporate-border bg-corporate-surface p-4 transition-all hover:bg-corporate-surface-hover active:bg-corporate-surface-hover"
            >
              <div className="text-left">
                <div className="text-[10px] tracking-wider text-corporate-text-tertiary uppercase">
                  {t('Tense')}
                </div>
                <div className="font-medium text-corporate-text-primary">{t(TENSE_KEYS[currentTense])}</div>
              </div>
              <ChevronRight
                size={16}
                className="text-corporate-text-tertiary transition-colors group-hover/btn:text-corporate-text-secondary"
              />
            </button>

            <button
              onClick={nextPerson}
              className="group/btn flex items-center justify-between rounded-corporate border border-corporate-border bg-corporate-surface p-4 transition-all hover:bg-corporate-surface-hover active:bg-corporate-surface-hover"
            >
              <div className="text-left">
                <div className="text-[10px] tracking-wider text-corporate-text-tertiary uppercase">
                  {t('Person')}
                </div>
                <div className="max-w-[80px] truncate font-medium text-corporate-text-primary">
                  {PERSON_LABELS[currentPerson].split(' / ')[0]}
                </div>
              </div>
              <ChevronRight
                size={16}
                className="text-corporate-text-tertiary transition-colors group-hover/btn:text-corporate-text-secondary"
              />
            </button>
          </div>

          {/* Conjugation Display */}
          <div className="rounded-corporate border border-corporate-border bg-corporate-bg-secondary p-6 text-center backdrop-blur-sm">
            <div className="mb-4">
              <div className="mb-1 text-3xl font-medium text-corporate-text-primary">
                {targetSubject} {targetConjugation}
              </div>
              <div className="text-base text-corporate-text-tertiary">
                {nativeSubject} {nativeConjugation}
              </div>
            </div>
            <div className="border-t border-corporate-border pt-4">
              <div className="mb-1 text-sm text-corporate-text-secondary italic">{targetSentence}</div>
              <div className="text-xs text-corporate-text-tertiary italic">{nativeSentence}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          onClick={prevVerb}
          className="flex flex-1 items-center justify-center gap-2 rounded-corporate bg-corporate-surface border border-corporate-border p-4 font-medium text-corporate-text-primary transition-all hover:bg-corporate-surface-hover active:scale-95"
        >
          <ArrowLeft size={18} />
          {t('Prev Verb')}
        </button>
        <button
          onClick={nextVerb}
          className="flex flex-1 items-center justify-center gap-2 rounded-corporate bg-corporate-accent-primary p-4 font-bold text-white shadow-corporate transition-all hover:bg-corporate-accent-hover active:scale-95"
        >
          {t('Next Verb')}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
