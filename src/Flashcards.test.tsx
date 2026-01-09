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
    // Mock shuffleArray to return items as-is for deterministic testing
    vi.mock('./utils/array', () => ({
      shuffleArray: vi.fn((arr: unknown[]) => arr),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders flashcards directly', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    expect(screen.getByText('Phrase to learn')).toBeInTheDocument();
  });

  it('shows region name with slang', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    // Cartagena SLANG should be visible for the first phrase (id: 1)
    expect(screen.getByText(/Cartagena/)).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    expect(screen.getByText(/1 \//)).toBeInTheDocument();
  });

  it('shows phrase to learn on flashcard', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );

    expect(screen.getByText('Phrase to learn')).toBeInTheDocument();
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  it('shows regional slang when available', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );

    expect(screen.getByText(/Cartagena SLANG/)).toBeInTheDocument();
    expect(screen.getByText('Buenas')).toBeInTheDocument();
  });

  it('shows reveal button initially', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );

    expect(screen.getByText(/Reveal/)).toBeInTheDocument();
  });

  it('reveals translation in user language when clicked', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    fireEvent.click(screen.getByText(/Reveal/));

    expect(screen.getByText('Your language')).toBeInTheDocument();
    // In id: 1, common.us-ca is "Hi"
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('allows navigation between flashcards', () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    fireEvent.click(screen.getByText('Next →'));

    expect(screen.getByText(/2 \//)).toBeInTheDocument();

    fireEvent.click(screen.getByText('← Previous'));
    expect(screen.getByText(/1 \//)).toBeInTheDocument();
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

    expect(screen.getByText('Listen')).toBeInTheDocument();
  });

  it('works for Spanish speakers learning English', () => {
    // Render with Spanish locale provider
    render(
      <LocaleProvider defaultLocale="es">
        <Flashcards targetLocale="us-ca" userLocale="es" onBack={mockOnBack} />
      </LocaleProvider>
    );

    // Should show English phrase to learn (Hi)
    expect(screen.getByText('Hi')).toBeInTheDocument();

    // Reveal should show Spanish translation (Hola)
    fireEvent.click(screen.getByText(/Revelar/));
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });
});
