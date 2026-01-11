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
    expect(await screen.findByText('Phrase to learn')).toBeInTheDocument();


    // First variant is "Hola"
    expect(await screen.findByText('Hola')).toBeInTheDocument();

    // Next variant -> "Buenas" (Slang)
    const nextBtn = screen.getByText('→');
    fireEvent.click(nextBtn);

    expect(await screen.findByText('Buenas')).toBeInTheDocument();
    expect(screen.getByText('SLANG')).toBeInTheDocument();
  });

  it('shows progress indicator', async () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );
    expect(await screen.findByText(/1 \//)).toBeInTheDocument();
  });

  it('shows phrase to learn on flashcard', async () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );

    expect(await screen.findByText('Phrase to learn')).toBeInTheDocument();
    // Front shows Target (Hola)
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });

  it('shows reveal button initially', async () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );

    expect(await screen.findByText(/Reveal/)).toBeInTheDocument();
  });

  it('reveals translation in user language when clicked', async () => {
    renderWithLocale(
      <Flashcards targetLocale="co-cartagena" userLocale="en" onBack={mockOnBack} />
    );

    const revealBtn = await screen.findByText(/Reveal/);
    fireEvent.click(revealBtn);

    expect(await screen.findByText('Your language')).toBeInTheDocument();
    // Back shows Source (Hi)
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

    expect(await screen.findByText(/2 \//)).toBeInTheDocument();
    expect(screen.getByText('Como estas')).toBeInTheDocument();

    const prevBtn = screen.getByText('← Previous');
    fireEvent.click(prevBtn);
    expect(await screen.findByText(/1 \//)).toBeInTheDocument();
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
