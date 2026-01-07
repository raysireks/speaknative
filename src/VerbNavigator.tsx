
import React, { useState, useEffect } from 'react';
import { getVerbsForLocale } from './data/verb-adapter';
import type { Verb } from './data/verb-adapter';
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

export const VerbNavigator: React.FC<VerbNavigatorProps> = ({ sourceLocale, targetLocale, userLocale, onBack }) => {
    const [verbs, setVerbs] = useState<Verb[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Persisted state across verbs
    const [currentTense, setCurrentTense] = useState<Tense>('present');
    const [currentPerson, setCurrentPerson] = useState<Person>('1s');

    useEffect(() => {
        const data = getVerbsForLocale(sourceLocale, targetLocale);
        setVerbs(data);
    }, [sourceLocale, targetLocale]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextVerb();
            if (e.key === 'ArrowLeft') prevVerb();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [verbs.length, currentIndex]); // Dep on verbs/index

    const t = (key: string) => getText(key, userLocale);

    if (verbs.length === 0) return <div className="p-8 text-center text-white/50">{t('Loading verbs...')}</div>;

    const verb = verbs[currentIndex];
    const targetConjugation = verb.conjugation?.[currentTense]?.[currentPerson] || '...';
    const nativeConjugation = verb.translationConjugation?.[currentTense]?.[currentPerson] || '...';

    // Navigation handlers
    const nextVerb = () => setCurrentIndex(prev => (prev + 1) % verbs.length);
    const prevVerb = () => setCurrentIndex(prev => (prev - 1 + verbs.length) % verbs.length);

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

    return (
        <div className="flex flex-col h-full max-w-md mx-auto w-full p-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="text-white/40 text-sm font-medium tracking-wider uppercase">
                    {t('Top 50 Verbs')} • {currentIndex + 1} / {verbs.length}
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Main Card */}
            <div className="flex-1 flex flex-col items-center justify-center relative perspective-container">
                <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-white/30 transition-all duration-300">

                    {/* Background Accent */}
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-500" />
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-all duration-500" />

                    {/* Verb Infinitive */}
                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-sm">{verb.infinitive}</h2>
                        <p className="text-white/60 text-lg">{verb.translation}</p>
                    </div>

                    {/* Conjugation Display */}
                    <div className="bg-black/20 rounded-2xl p-6 mb-6 text-center border border-white/5 backdrop-blur-sm">
                        <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                            {t(TENSE_KEYS[currentTense])} • {PERSON_LABELS[currentPerson]}
                        </div>
                        <div className="text-3xl font-medium text-white mb-1">
                            {targetConjugation}
                        </div>
                        <div className="text-base text-white/50">
                            {nativeConjugation}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={nextTense}
                            className="p-4 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl flex items-center justify-between group/btn transition-all"
                        >
                            <div className="text-left">
                                <div className="text-[10px] uppercase tracking-wider text-white/40">{t('Tense')}</div>
                                <div className="text-white font-medium">{t(TENSE_KEYS[currentTense])}</div>
                            </div>
                            <ChevronRight size={16} className="text-white/30 group-hover/btn:text-white/70 transition-colors" />
                        </button>

                        <button
                            onClick={nextPerson}
                            className="p-4 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-xl flex items-center justify-between group/btn transition-all"
                        >
                            <div className="text-left">
                                <div className="text-[10px] uppercase tracking-wider text-white/40">{t('Person')}</div>
                                <div className="text-white font-medium truncate max-w-[80px]">{PERSON_LABELS[currentPerson].split(' / ')[0]}</div>
                            </div>
                            <ChevronRight size={16} className="text-white/30 group-hover/btn:text-white/70 transition-colors" />
                        </button>
                    </div>

                </div>
            </div>

            {/* Navigation Footer */}
            <div className="mt-8 flex items-center justify-between gap-4">
                <button
                    onClick={prevVerb}
                    className="flex-1 p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <ArrowLeft size={18} />
                    {t('Prev Verb')}
                </button>
                <button
                    onClick={nextVerb}
                    className="flex-1 p-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-white/20 hover:scale-[1.02] transition-all active:scale-95"
                >
                    {t('Next Verb')}
                    <ArrowRight size={18} />
                </button>
            </div>

        </div>
    );
};

