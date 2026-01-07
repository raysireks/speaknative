import { useState } from 'react';
import { LocaleProvider } from './context/LocaleContext';
import type { SupportedLocale } from './data/locales';
import Landing from './Landing';
import Flashcards from './Flashcards';
import { VerbNavigator } from './VerbNavigator';


function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'flashcards' | 'verbs'>('landing');
  const [selectedTargetLocale, setSelectedTargetLocale] = useState<string>('');
  const [userLocale, setUserLocale] = useState<SupportedLocale>('en');

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
        <div className="min-h-screen bg-black overflow-hidden flex flex-col">
          {/* Simple wrapper for verbs similar to Flashcards or standalone */}
          <VerbNavigator
            sourceLocale={userLocale === 'en' ? 'us-ca' : 'co-cartagena'} // Native locale (Source)
            targetLocale={selectedTargetLocale}
            userLocale={userLocale}
            onBack={handleBackToLanding}
          />
        </div>
      )}
    </LocaleProvider>
  );
}

export default App;
