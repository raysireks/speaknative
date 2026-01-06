import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocaleProvider } from './context/LocaleContext';
import Landing from './Landing';

// Helper to render with locale context
const renderWithLocale = (ui: React.ReactElement) => {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
};

describe('Landing', () => {
  const mockOnStartFlashcards = vi.fn();

  beforeEach(() => {
    mockOnStartFlashcards.mockClear();
  });

  it('displays the app name', () => {
    renderWithLocale(<Landing />);
    expect(screen.getByText('SpeakNative')).toBeInTheDocument();
  });

  it('shows "I speak" toggle button', () => {
    renderWithLocale(<Landing />);
    expect(screen.getByLabelText('Toggle my language')).toBeInTheDocument();
  });

  it('filters regions based on language', () => {
    renderWithLocale(<Landing />);

    // Default is English user -> Spanish regions
    expect(screen.getByText('Cartagena')).toBeInTheDocument();

    // Switch to Spanish user -> English regions
    const toggleButton = screen.getByLabelText('Toggle my language');
    fireEvent.click(toggleButton);

    expect(screen.getByText('California')).toBeInTheDocument();
  });

  it('selects a region when clicked', () => {
    renderWithLocale(<Landing />);

    // Switch to Spanish user -> English regions
    const toggleButton = screen.getByLabelText('Toggle my language');
    fireEvent.click(toggleButton);

    fireEvent.click(screen.getByText('California'));

    expect(screen.getByText('Ready to Learn!')).toBeInTheDocument();
    expect(screen.getByText('California English 🇺🇸')).toBeInTheDocument();
  });

  it('allows selecting a region', () => {
    renderWithLocale(<Landing onStartFlashcards={mockOnStartFlashcards} />);

    const cartagenaButton = screen.getByLabelText('Select Cartagena');
    fireEvent.click(cartagenaButton);

    expect(screen.getByText('Ready to Learn!')).toBeInTheDocument();
  });

  it('shows Start Flashcards button after region selection', () => {
    renderWithLocale(<Landing onStartFlashcards={mockOnStartFlashcards} />);

    fireEvent.click(screen.getByLabelText('Select Cartagena'));

    expect(screen.getByText('Start Flashcards')).toBeInTheDocument();
  });

  it('calls onStartFlashcards with locale and userLocale when starting', () => {
    renderWithLocale(<Landing onStartFlashcards={mockOnStartFlashcards} />);

    fireEvent.click(screen.getByLabelText('Select Cartagena'));
    fireEvent.click(screen.getByText('Start Flashcards'));

    expect(mockOnStartFlashcards).toHaveBeenCalledWith('co-cartagena', 'en');
  });

  it('allows changing region', () => {
    renderWithLocale(<Landing onStartFlashcards={mockOnStartFlashcards} />);

    fireEvent.click(screen.getByLabelText('Select Cartagena'));
    fireEvent.click(screen.getByText('Change Region'));

    expect(screen.getByText('Choose a region to learn')).toBeInTheDocument();
  });

  it('passes correct userLocale when Spanish is selected', () => {
    renderWithLocale(<Landing onStartFlashcards={mockOnStartFlashcards} />);

    // Toggle to Spanish
    fireEvent.click(screen.getByLabelText('Toggle my language'));

    // Select East Coast
    fireEvent.click(screen.getByLabelText('Select East Coast'));
    // Button text is now in Spanish: 'Iniciar Tarjetas'
    fireEvent.click(screen.getByLabelText('Start learning with flashcards'));

    expect(mockOnStartFlashcards).toHaveBeenCalledWith('us-eastcoast', 'es');
  });
});
