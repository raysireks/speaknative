import { useState } from 'react';
import { LocaleProvider } from './context/LocaleContext';
import type { SupportedLocale } from './data/locales';
import Landing from './Landing';
import Flashcards from './Flashcards';
import { VerbNavigator } from './VerbNavigator';
import { ReviewSession } from './components/ReviewSession';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'flashcards' | 'verbs' | 'review'>(
    'landing'
  );
  const [selectedTargetLocale, setSelectedTargetLocale] = useState<string>('');
  const [userLocale, setUserLocale] = useState<SupportedLocale>('en');
  const [reviewMode, setReviewMode] = useState<'audio-only' | 'speaker'>('audio-only');

  const handleStartFlashcards = (targetLocale: string, userLang: SupportedLocale) => {
    setSelectedTargetLocale(targetLocale);
    setUserLocale(userLang);
    setCurrentView('flashcards');
  };

  const handleStartVerbs = (targetLocale: string, userLang: SupportedLocale) => {
    setSelectedTargetLocale(targetLocale);
    setUserLocale(userLang);
    setCurrentView('verbs');
  };

  const handleStartReview = (
    targetLocale: string,
    userLang: SupportedLocale,
    mode: 'audio-only' | 'speaker'
  ) => {
    setSelectedTargetLocale(targetLocale);
    setUserLocale(userLang);
    setReviewMode(mode);
    setCurrentView('review');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedTargetLocale('');
  };

  return (
    <LocaleProvider>
      {currentView === 'landing' && (
        <Landing
          onStartFlashcards={handleStartFlashcards}
          onStartVerbs={handleStartVerbs}
          onStartReview={handleStartReview}
        />
      )}
      {currentView === 'flashcards' && (
        <Flashcards
          targetLocale={selectedTargetLocale}
          userLocale={userLocale}
          onBack={handleBackToLanding}
        />
      )}
      {currentView === 'verbs' && (
        <div className="flex min-h-screen flex-col overflow-hidden bg-corporate-bg-primary">
          {/* Simple wrapper for verbs similar to Flashcards or standalone */}
          <VerbNavigator
            sourceLocale={userLocale === 'en' ? 'us-ca' : 'co-cartagena'} // Native locale (Source)
            targetLocale={selectedTargetLocale}
            userLocale={userLocale}
            onBack={handleBackToLanding}
          />
        </div>
      )}
      {currentView === 'review' && (
        <ReviewSession
          targetLocale={selectedTargetLocale}
          userLocale={userLocale}
          onBack={handleBackToLanding}
          initialMode={reviewMode}
        />
      )}
    </LocaleProvider>
  );
}

export default App;
