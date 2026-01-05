import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Learning from './Learning';

describe('Learning', () => {
  let mockOnBack: () => void;

  beforeEach(() => {
    mockOnBack = vi.fn();
  });

  it('renders learning page with correct language', () => {
    render(<Learning language="english" locale="us-midwest" onBack={mockOnBack} />);
    expect(screen.getByText('Learning English')).toBeInTheDocument();
    expect(screen.getByText('Practice common phrases')).toBeInTheDocument();
  });

  it('displays the first phrase by default', () => {
    render(<Learning language="english" locale="us-midwest" onBack={mockOnBack} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('[heh-LOH]')).toBeInTheDocument();
  });

  it('shows translation when button is clicked', () => {
    render(<Learning language="english" locale="us-midwest" onBack={mockOnBack} />);

    const showButton = screen.getByLabelText('Show translation');
    fireEvent.click(showButton);

    expect(screen.getByText('A common greeting')).toBeInTheDocument();
    expect(screen.getByLabelText('Hide translation')).toBeInTheDocument();
  });

  it('hides translation when hide button is clicked', () => {
    render(<Learning language="english" locale="us-midwest" onBack={mockOnBack} />);

    // Show translation
    const showButton = screen.getByLabelText('Show translation');
    fireEvent.click(showButton);
    expect(screen.getByText('A common greeting')).toBeInTheDocument();

    // Hide translation
    const hideButton = screen.getByLabelText('Hide translation');
    fireEvent.click(hideButton);
    expect(screen.queryByText('A common greeting')).not.toBeInTheDocument();
  });

  it('navigates to next phrase when next button is clicked', () => {
    render(<Learning language="english" locale="us-midwest" onBack={mockOnBack} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();

    const nextButton = screen.getByLabelText('Next phrase');
    fireEvent.click(nextButton);

    expect(screen.getByText('How are you?')).toBeInTheDocument();
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('navigates to previous phrase when previous button is clicked', () => {
    render(<Learning language="english" locale="us-midwest" onBack={mockOnBack} />);

    // Go to second phrase
    const nextButton = screen.getByLabelText('Next phrase');
    fireEvent.click(nextButton);
    expect(screen.getByText('How are you?')).toBeInTheDocument();

    // Go back to first phrase
    const previousButton = screen.getByLabelText('Previous phrase');
    fireEvent.click(previousButton);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('disables previous button on first phrase', () => {
    render(<Learning language="english" locale="us-midwest" onBack={mockOnBack} />);

    const previousButton = screen.getByLabelText('Previous phrase');
    expect(previousButton).toBeDisabled();
  });

  it('disables next button on last phrase', () => {
    render(<Learning language="english" locale="us-midwest" onBack={mockOnBack} />);

    // Navigate to last phrase
    const nextButton = screen.getByLabelText('Next phrase');
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(nextButton).toBeDisabled();
  });

  it('displays phrase counter', () => {
    render(<Learning language="english" locale="us-midwest" onBack={mockOnBack} />);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    const nextButton = screen.getByLabelText('Next phrase');
    fireEvent.click(nextButton);

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<Learning language="english" locale="us-midwest" onBack={mockOnBack} />);

    const backButton = screen.getByLabelText('Back to home');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('hides translation when navigating between phrases', () => {
    render(<Learning language="english" locale="us-midwest" onBack={mockOnBack} />);

    // Show translation
    const showButton = screen.getByLabelText('Show translation');
    fireEvent.click(showButton);
    expect(screen.getByText('A common greeting')).toBeInTheDocument();

    // Navigate to next phrase
    const nextButton = screen.getByLabelText('Next phrase');
    fireEvent.click(nextButton);

    // Translation should be hidden for new phrase
    expect(screen.queryByText('A common greeting')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Show translation')).toBeInTheDocument();
  });

  it('displays Spanish content for Spanish locale', () => {
    render(<Learning language="spanish" locale="co-cartagena" onBack={mockOnBack} />);

    expect(screen.getByText('Learning Spanish')).toBeInTheDocument();
    expect(screen.getByText('¿Qué más?')).toBeInTheDocument();
    expect(screen.getByText('[keh mahs]')).toBeInTheDocument();
  });

  it('shows message when no content is available', () => {
    render(<Learning language="french" locale="fr-paris" onBack={mockOnBack} />);

    expect(
      screen.getByText('No learning content available for this selection.')
    ).toBeInTheDocument();

    const goBackButton = screen.getByLabelText('Go back');
    fireEvent.click(goBackButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
