import { useState } from 'react';
import Landing from './Landing';
import Learning from './Learning';

type Page = 'landing' | 'learning';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedLocale, setSelectedLocale] = useState<string>('');

  const handleStartLearning = (language: string, locale: string) => {
    setSelectedLanguage(language);
    setSelectedLocale(locale);
    setCurrentPage('learning');
  };

  const handleBackToLanding = () => {
    setCurrentPage('landing');
  };

  return (
    <>
      {currentPage === 'landing' && <Landing onStartLearning={handleStartLearning} />}
      {currentPage === 'learning' && (
        <Learning
          language={selectedLanguage}
          locale={selectedLocale}
          onBack={handleBackToLanding}
        />
      )}
    </>
  );
}

export default App;
