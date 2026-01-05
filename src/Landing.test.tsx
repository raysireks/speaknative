import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Landing from './Landing';

describe('Landing', () => {
  it('renders the main heading', () => {
    render(<Landing />);
    expect(screen.getByText('SpeakNative')).toBeInTheDocument();
  });

  it('renders app language selector', () => {
    render(<Landing />);
    expect(screen.getByLabelText('Switch to English')).toBeInTheDocument();
    expect(screen.getByLabelText('Switch to Spanish')).toBeInTheDocument();
  });

  it('renders language selection initially', () => {
    render(<Landing />);
    expect(screen.getByText('Select Your Language')).toBeInTheDocument();
    expect(screen.getByText('English', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('Spanish', { selector: 'h3' })).toBeInTheDocument();
  });

  it('shows locale selection after selecting English', () => {
    render(<Landing />);
    const englishButton = screen.getByLabelText('Select English');
    fireEvent.click(englishButton);

    expect(screen.getByText('Select Your Locale')).toBeInTheDocument();
    expect(screen.getByText('United States - Midwest')).toBeInTheDocument();
    expect(screen.getByText('United States - East Coast')).toBeInTheDocument();
  });

  it('shows locale selection after selecting Spanish', () => {
    render(<Landing />);
    const spanishButton = screen.getByLabelText('Select Spanish');
    fireEvent.click(spanishButton);

    expect(screen.getByText('Select Your Locale')).toBeInTheDocument();
    expect(screen.getByText('Colombia - Cartagena')).toBeInTheDocument();
    expect(screen.getByText('Colombia - Medellín')).toBeInTheDocument();
  });

  it('shows selection complete screen after choosing language and locale', () => {
    render(<Landing />);

    // Select English
    const englishButton = screen.getByLabelText('Select English');
    fireEvent.click(englishButton);

    // Select Midwest locale
    const midwestButton = screen.getByLabelText('Select United States - Midwest');
    fireEvent.click(midwestButton);

    expect(screen.getByText('Selection Complete!')).toBeInTheDocument();
    expect(screen.getByText('Language:')).toBeInTheDocument();
    expect(screen.getByText('United States - Midwest')).toBeInTheDocument();
  });

  it('allows returning to language selection from locale selection', () => {
    render(<Landing />);

    // Select English
    const englishButton = screen.getByLabelText('Select English');
    fireEvent.click(englishButton);

    // Click Back
    const backButton = screen.getByLabelText('Back to language selection');
    fireEvent.click(backButton);

    expect(screen.getByText('Select Your Language')).toBeInTheDocument();
  });

  it('calls onStartFlashcards when Start Learning is clicked', () => {
    const mockOnStartFlashcards = vi.fn();
    render(<Landing onStartFlashcards={mockOnStartFlashcards} />);

    // Complete selection
    fireEvent.click(screen.getByLabelText('Select Spanish'));
    fireEvent.click(screen.getByLabelText('Select Colombia - Cartagena'));

    // Click Start Learning
    const startLearningButton = screen.getByLabelText('Start learning with flashcards');
    fireEvent.click(startLearningButton);

    expect(mockOnStartFlashcards).toHaveBeenCalledWith('co-cartagena');
  });

  it('allows starting over from selection complete screen', () => {
    render(<Landing />);

    // Complete selection
    fireEvent.click(screen.getByLabelText('Select Spanish'));
    fireEvent.click(screen.getByLabelText('Select Colombia - Cartagena'));

    // Start over
    const startOverButton = screen.getByLabelText('Start over');
    fireEvent.click(startOverButton);

    expect(screen.getByText('Select Your Language')).toBeInTheDocument();
  });
});
