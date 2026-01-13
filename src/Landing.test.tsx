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
  const mockOnStartReview = vi.fn();
  const mockOnSelectTargetLocale = vi.fn();

  beforeEach(() => {
    mockOnStartFlashcards.mockClear();
    mockOnStartReview.mockClear();
    mockOnSelectTargetLocale.mockClear();
  });

  it('displays the app name', () => {
    renderWithLocale(
      <Landing selectedTargetLocale="" onSelectTargetLocale={mockOnSelectTargetLocale} />
    );
    expect(screen.getByText('SpeakNative')).toBeInTheDocument();
  });

  it('shows "I speak" toggle button', () => {
    renderWithLocale(
      <Landing selectedTargetLocale="" onSelectTargetLocale={mockOnSelectTargetLocale} />
    );
    expect(screen.getByRole('button', { name: /Change native language/i })).toBeInTheDocument();
  });

  it('filters regions based on language', () => {
    renderWithLocale(
      <Landing selectedTargetLocale="" onSelectTargetLocale={mockOnSelectTargetLocale} />
    );

    // Default is English user -> Spanish regions
    expect(screen.getByText('Cartagena')).toBeInTheDocument();

    // Switch to Spanish user -> English regions
    const toggleButton = screen.getByRole('button', { name: /Change native language/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText('California')).toBeInTheDocument();
  });

  it('selects a region when clicked', () => {
    // We need to provide a value or handle state in the test
    // For simplicity, we can just test that the click calls the mock
    renderWithLocale(
      <Landing selectedTargetLocale="" onSelectTargetLocale={mockOnSelectTargetLocale} />
    );

    // Default is English user -> Spanish regions
    fireEvent.click(screen.getByText('Cartagena'));
    expect(mockOnSelectTargetLocale).toHaveBeenCalledWith('co-cartagena');
  });

  it('displays "Ready to Learn" UI when region is selected', () => {
    renderWithLocale(
      <Landing selectedTargetLocale="co-cartagena" onSelectTargetLocale={mockOnSelectTargetLocale} />
    );
    expect(screen.getByText('Ready to Learn!')).toBeInTheDocument();
  });

  it('shows Start Flashcards button after region selection', () => {
    renderWithLocale(
      <Landing
        selectedTargetLocale="co-cartagena"
        onSelectTargetLocale={mockOnSelectTargetLocale}
        onStartFlashcards={mockOnStartFlashcards}
      />
    );

    expect(screen.getByText('Flashcards')).toBeInTheDocument();
  });

  it('calls onStartFlashcards with locale and userLocale when starting', () => {
    renderWithLocale(
      <Landing
        selectedTargetLocale="co-cartagena"
        onSelectTargetLocale={mockOnSelectTargetLocale}
        onStartFlashcards={mockOnStartFlashcards}
      />
    );

    fireEvent.click(screen.getByText('Flashcards'));

    expect(mockOnStartFlashcards).toHaveBeenCalledWith('co-cartagena', 'en');
  });

  it('allows changing region', () => {
    renderWithLocale(
      <Landing selectedTargetLocale="co-cartagena" onSelectTargetLocale={mockOnSelectTargetLocale} />
    );

    fireEvent.click(screen.getByText('← Choose a different region'));

    expect(mockOnSelectTargetLocale).toHaveBeenCalledWith('');
  });

  it('passes correct userLocale when Spanish is selected', () => {
    renderWithLocale(
      <LocaleProvider>
        <Landing
          selectedTargetLocale=""
          onSelectTargetLocale={mockOnSelectTargetLocale}
          onStartFlashcards={mockOnStartFlashcards}
        />
      </LocaleProvider>
    );

    // Toggle to Spanish (select Medellín as native region)
    fireEvent.click(screen.getByRole('button', { name: /Change native language/i }));
    fireEvent.click(screen.getAllByText('Medellín')[0]); // Use getAllByText because Medellín might appear twice (as target if we were already Spanish, but here it's in overlay)

    // Now as a Spanish speaker, select California as learning region
    fireEvent.click(screen.getByText('California'));
    expect(mockOnSelectTargetLocale).toHaveBeenCalledWith('us-ca');

    // Re-render with selected region to show the next screen
    render(
      <LocaleProvider defaultLocale="es-CO-MDE">
        <Landing
          selectedTargetLocale="us-ca"
          onSelectTargetLocale={mockOnSelectTargetLocale}
          onStartFlashcards={mockOnStartFlashcards}
        />
      </LocaleProvider>
    );

    fireEvent.click(screen.getByText('Flashcards'));

    expect(mockOnStartFlashcards).toHaveBeenCalledWith('us-ca', 'es-CO-MDE');
  });

  it('shows Audio Challenge button after region selection', () => {
    renderWithLocale(
      <Landing
        selectedTargetLocale="co-cartagena"
        onSelectTargetLocale={mockOnSelectTargetLocale}
        onStartReview={mockOnStartReview}
      />
    );

    expect(screen.getByText('Listening')).toBeInTheDocument();
  });

  it('shows Translation Challenge button after region selection', () => {
    renderWithLocale(
      <Landing
        selectedTargetLocale="co-cartagena"
        onSelectTargetLocale={mockOnSelectTargetLocale}
        onStartReview={mockOnStartReview}
      />
    );

    expect(screen.getByText('Speaking')).toBeInTheDocument();
  });

  it('calls onStartReview with audio-only mode when Audio Challenge is clicked', () => {
    renderWithLocale(
      <Landing
        selectedTargetLocale="co-cartagena"
        onSelectTargetLocale={mockOnSelectTargetLocale}
        onStartReview={mockOnStartReview}
      />
    );

    fireEvent.click(screen.getByText('Listening'));

    expect(mockOnStartReview).toHaveBeenCalledWith('co-cartagena', 'en', 'audio-only');
  });

  it('calls onStartReview with speaker mode when Translation Challenge is clicked', () => {
    renderWithLocale(
      <Landing
        selectedTargetLocale="co-cartagena"
        onSelectTargetLocale={mockOnSelectTargetLocale}
        onStartReview={mockOnStartReview}
      />
    );

    fireEvent.click(screen.getByText('Speaking'));

    expect(mockOnStartReview).toHaveBeenCalledWith('co-cartagena', 'en', 'speaker');
  });
});
