import { useState } from 'react';
import Landing from './Landing';
import Flashcards from './Flashcards';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'flashcards'>('landing');
  const [selectedLocale, setSelectedLocale] = useState<string>('');

  const handleStartFlashcards = (locale: string) => {
    setSelectedLocale(locale);
    setCurrentView('flashcards');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSelectedLocale('');
  };

  return (
    <>
      {currentView === 'landing' ? (
        <Landing onStartFlashcards={handleStartFlashcards} />
      ) : (
        <Flashcards locale={selectedLocale} onBack={handleBackToLanding} />
      )}
    </>
  );
}

export default App;
