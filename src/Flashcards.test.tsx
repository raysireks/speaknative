import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocaleProvider } from './context/LocaleContext';
import Flashcards from './Flashcards';

// Helper to render with locale context
const renderWithLocale = (ui: React.ReactElement) => {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
};

describe('Flashcards', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockOnBack.mockClear();
  });

  it('shows settings screen before starting', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    expect(screen.getByText('Flashcard Settings')).toBeInTheDocument();
  });

  it('shows region name in settings', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    expect(screen.getByText('Cartagena')).toBeInTheDocument();
  });

  it('allows user to start flashcards', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    fireEvent.click(screen.getByText('Start Learning'));

    expect(screen.getByText('1 / 100')).toBeInTheDocument();
  });

  it('shows phrase to learn on flashcard', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    fireEvent.click(screen.getByText('Start Learning'));

    expect(screen.getByText('Phrase to learn')).toBeInTheDocument();
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  it('shows regional slang when available', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    fireEvent.click(screen.getByText('Start Learning'));

    expect(screen.getByText('Cartagena SLANG')).toBeInTheDocument();
    expect(screen.getByText('¿Qué más?')).toBeInTheDocument();
  });

  it('shows reveal button initially', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    fireEvent.click(screen.getByText('Start Learning'));

    expect(screen.getByText('Reveal 🇺🇸')).toBeInTheDocument();
  });

  it('reveals translation in user language when clicked', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    fireEvent.click(screen.getByText('Start Learning'));
    fireEvent.click(screen.getByText('Reveal 🇺🇸'));

    expect(screen.getByText('Your language')).toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('allows navigation between flashcards', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    fireEvent.click(screen.getByText('Start Learning'));
    fireEvent.click(screen.getByText('Next →'));

    expect(screen.getByText('2 / 100')).toBeInTheDocument();

    fireEvent.click(screen.getByText('← Previous'));
    expect(screen.getByText('1 / 100')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    fireEvent.click(screen.getByText('Back'));

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('handles empty phrases gracefully', () => {
    renderWithLocale(
      <Flashcards targetLocale="invalid-locale" userLocale="en" onBack={mockOnBack} />
    );
    expect(screen.getByText('No Phrases Available')).toBeInTheDocument();
  });

  it('shows audio button with listen text', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    fireEvent.click(screen.getByText('Start Learning'));

    expect(screen.getByText('Listen')).toBeInTheDocument();
  });

  it('works for Spanish speakers learning English', () => {
    // Render with Spanish locale provider
    render(
      <LocaleProvider defaultLocale="es">
        <Flashcards targetLocale="us-ca" userLocale="es" onBack={mockOnBack} />
      </LocaleProvider>
    );
    // UI is in Spanish - 'Comenzar a Aprender' means 'Start Learning'
    fireEvent.click(screen.getByText('Comenzar a Aprender'));

    // Should show English phrase to learn
    expect(screen.getByText('Hi')).toBeInTheDocument();

    // Reveal should show Spanish translation
    fireEvent.click(screen.getByText('Revelar 🇪🇸'));
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });
});
