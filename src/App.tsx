import { useState } from 'react';
import { LocaleProvider } from './context/LocaleContext';
import type { SupportedLocale } from './data/locales';
import Landing from './Landing';
import Flashcards from './Flashcards';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'flashcards'>('landing');
  const [selectedTargetLocale, setSelectedTargetLocale] = useState<string>('');
  const [userLocale, setUserLocale] = useState<SupportedLocale>('en');

  const handleStartFlashcards = (targetLocale: string, userLang: SupportedLocale) => {
    setSelectedTargetLocale(targetLocale);
    setUserLocale(userLang);
    setCurrentView('flashcards');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedTargetLocale('');
  };

  return (
    <LocaleProvider>
      {currentView === 'landing' ? (
        <Landing onStartFlashcards={handleStartFlashcards} />
      ) : (
        <Flashcards
          targetLocale={selectedTargetLocale}
          userLocale={userLocale}
          onBack={handleBackToLanding}
        />
      )}
    </LocaleProvider>
  );
}

export default App;
