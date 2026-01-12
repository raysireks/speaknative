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

    // Mock getDynamicPhrases
    vi.mock('./data/phrase-adapter', () => ({
      getDynamicPhrases: vi.fn().mockResolvedValue([
        {
          id: 1,
          text: 'Hola', // Target (Front)
          translation: 'Hi', // Source (Back)
          is_slang: false,
          variants: [
            { text: 'Hola', is_slang: false, score: 1.0 },
            { text: 'Buenas', is_slang: true, score: 0.9 }
          ]
        },
        {
          id: 2,
          text: 'Como estas',
          translation: 'How are you',
          is_slang: false,
          variants: [{ text: 'Como estas', is_slang: false, score: 1.0 }]
        }
      ]),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders flashcards after loading', async () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    expect(await screen.findByText('Variations to learn')).toBeInTheDocument();
  });

  it('shows slang variant when cycling', async () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );

    // First variant is "Hola"
    expect(await screen.findByText('Hola')).toBeInTheDocument();

    // Next variant -> "Buenas" (Slang)
    const nextBtn = screen.getByLabelText('Next variation');
    fireEvent.click(nextBtn);

    expect(await screen.findByText('Buenas')).toBeInTheDocument();
    expect(screen.getByText('SLANG')).toBeInTheDocument();
  });

  it('shows progress indicator', async () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    const counters = await screen.findAllByText(/1 \//);
    expect(counters.length).toBeGreaterThan(0);
  });

  it('shows variations section on flashcard', async () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );

    expect(await screen.findByText('Variations to learn')).toBeInTheDocument();
    // Front shows Target (Hola)
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  it('shows meaning section and translation immediately', async () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );

    expect(await screen.findByText('Meaning')).toBeInTheDocument();
    // Shows Source (Hi)
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('allows navigation between flashcards', async () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );

    // Wait for load
    await screen.findByText('Hola');

    const nextBtn = screen.getByText('Next →');
    fireEvent.click(nextBtn);

    const counters2 = await screen.findAllByText(/2 \//);
    expect(counters2.length).toBeGreaterThan(0);
    expect(screen.getByText('Como estas')).toBeInTheDocument();

    const prevBtn = screen.getByText('← Previous');
    fireEvent.click(prevBtn);

    const counters = await screen.findAllByText(/1 \//);
    expect(counters.length).toBeGreaterThan(0);
  });

  it('calls onBack when back button is clicked', async () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    // Wait for header
    await screen.findByText('Back');

    fireEvent.click(screen.getByText('Back'));

    expect(mockOnBack).toHaveBeenCalled();
  });


  it('shows audio button with listen text', async () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );

    expect(await screen.findByText('Listen')).toBeInTheDocument();
  });

});
