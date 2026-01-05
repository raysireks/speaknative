import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Landing from './Landing';

describe('Landing', () => {
  let mockOnStartLearning: (language: string, locale: string) => void;

  beforeEach(() => {
    mockOnStartLearning = vi.fn();
  });

  it('renders the main heading', () => {
    render(<Landing onStartLearning={mockOnStartLearning} />);
    expect(screen.getByText('SpeakNative')).toBeInTheDocument();
  });

  it('renders language selection initially', () => {
    render(<Landing onStartLearning={mockOnStartLearning} />);
    expect(screen.getByText('Select Your Language')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Spanish')).toBeInTheDocument();
  });

  it('shows locale selection after selecting English', () => {
    render(<Landing onStartLearning={mockOnStartLearning} />);
    const englishButton = screen.getByLabelText('Select English');
    fireEvent.click(englishButton);

    expect(screen.getByText('Select Your Locale')).toBeInTheDocument();
    expect(screen.getByText('United States - Midwest')).toBeInTheDocument();
    expect(screen.getByText('United States - East Coast')).toBeInTheDocument();
  });

  it('shows locale selection after selecting Spanish', () => {
    render(<Landing onStartLearning={mockOnStartLearning} />);
    const spanishButton = screen.getByLabelText('Select Spanish');
    fireEvent.click(spanishButton);

    expect(screen.getByText('Select Your Locale')).toBeInTheDocument();
    expect(screen.getByText('Colombia - Cartagena')).toBeInTheDocument();
    expect(screen.getByText('Colombia - Medellín')).toBeInTheDocument();
  });

  it('shows selection complete screen after choosing language and locale', () => {
    render(<Landing onStartLearning={mockOnStartLearning} />);

    // Select English
    const englishButton = screen.getByLabelText('Select English');
    fireEvent.click(englishButton);

    // Select Midwest locale
    const midwestButton = screen.getByLabelText('Select United States - Midwest');
    fireEvent.click(midwestButton);

    expect(screen.getByText('Selection Complete!')).toBeInTheDocument();
    expect(screen.getByText(/english/i)).toBeInTheDocument();
    expect(screen.getByText('United States - Midwest')).toBeInTheDocument();
  });

  it('allows returning to language selection from locale selection', () => {
    render(<Landing onStartLearning={mockOnStartLearning} />);

    // Select English
    const englishButton = screen.getByLabelText('Select English');
    fireEvent.click(englishButton);

    // Click Back
    const backButton = screen.getByLabelText('Back to language selection');
    fireEvent.click(backButton);

    expect(screen.getByText('Select Your Language')).toBeInTheDocument();
  });

  it('allows starting over from selection complete screen', () => {
    render(<Landing onStartLearning={mockOnStartLearning} />);

    // Complete selection
    fireEvent.click(screen.getByLabelText('Select Spanish'));
    fireEvent.click(screen.getByLabelText('Select Colombia - Cartagena'));

    // Start over
    const startOverButton = screen.getByLabelText('Start over');
    fireEvent.click(startOverButton);

    expect(screen.getByText('Select Your Language')).toBeInTheDocument();
  });

  it('calls onStartLearning when start learning button is clicked', () => {
    render(<Landing onStartLearning={mockOnStartLearning} />);

    // Select English and locale
    fireEvent.click(screen.getByLabelText('Select English'));
    fireEvent.click(screen.getByLabelText('Select United States - Midwest'));

    // Click Start Learning
    const startLearningButton = screen.getByLabelText('Start learning');
    fireEvent.click(startLearningButton);

    expect(mockOnStartLearning).toHaveBeenCalledTimes(1);
    expect(mockOnStartLearning).toHaveBeenCalledWith('english', 'us-midwest');
  });
});
