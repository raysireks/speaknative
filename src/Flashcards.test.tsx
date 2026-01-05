import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Flashcards from './Flashcards';

describe('Flashcards', () => {
  const mockOnBack = vi.fn();

  it('shows settings screen before starting', () => {
    render(<Flashcards locale="us-midwest" onBack={mockOnBack} />);
    expect(screen.getByText('Flashcards Settings')).toBeInTheDocument();
    expect(screen.getByText('Total Phrases:')).toBeInTheDocument();
  });

  it('shows include slang checkbox', () => {
    render(<Flashcards locale="us-midwest" onBack={mockOnBack} />);
    expect(screen.getByText('Include Slang')).toBeInTheDocument();
    expect(
      screen.getByText('Mix in 30 Gen Z & Millennial slang phrases from the last 5 years')
    ).toBeInTheDocument();
  });

  it('allows user to start flashcards', () => {
    render(<Flashcards locale="us-midwest" onBack={mockOnBack} />);
    const startButton = screen.getByText('Start Flashcards');
    fireEvent.click(startButton);

    // Should show first phrase
    expect(screen.getByText('1 / 70')).toBeInTheDocument();
  });

  it('shows all phrases when slang is included', () => {
    render(<Flashcards locale="us-midwest" onBack={mockOnBack} />);
    const slangCheckbox = screen.getByRole('checkbox');
    fireEvent.click(slangCheckbox);

    const startButton = screen.getByText('Start Flashcards');
    fireEvent.click(startButton);

    // Should show total of 100 phrases
    expect(screen.getByText('1 / 100')).toBeInTheDocument();
  });

  it('allows navigation between flashcards', () => {
    render(<Flashcards locale="us-midwest" onBack={mockOnBack} />);
    fireEvent.click(screen.getByText('Start Flashcards'));

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(screen.getByText('2 / 70')).toBeInTheDocument();

    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);

    expect(screen.getByText('1 / 70')).toBeInTheDocument();
  });

  it('shows translation when flip button is clicked', () => {
    render(<Flashcards locale="us-midwest" onBack={mockOnBack} />);
    fireEvent.click(screen.getByText('Start Flashcards'));

    expect(screen.getByText('Phrase')).toBeInTheDocument();

    const flipButton = screen.getByText('Show Translation');
    fireEvent.click(flipButton);

    expect(screen.getByText('Translation')).toBeInTheDocument();
    expect(screen.getByText('Show Phrase')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<Flashcards locale="us-midwest" onBack={mockOnBack} />);
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('handles invalid locale gracefully', () => {
    render(<Flashcards locale="invalid" onBack={mockOnBack} />);
    expect(screen.getByText('Invalid Locale')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('shows slang badge for slang phrases', () => {
    render(<Flashcards locale="us-midwest" onBack={mockOnBack} />);

    // Enable slang
    const slangCheckbox = screen.getByRole('checkbox');
    fireEvent.click(slangCheckbox);

    fireEvent.click(screen.getByText('Start Flashcards'));

    // Navigate to a slang phrase (they start at position 71)
    const nextButton = screen.getByText('Next');
    for (let i = 0; i < 70; i++) {
      fireEvent.click(nextButton);
    }

    expect(screen.getByText('SLANG')).toBeInTheDocument();
  });
});
