import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Landing from './Landing';

describe('Landing', () => {
  it('renders the main heading', () => {
    render(<Landing />);
    expect(screen.getByText('SpeakNative')).toBeInTheDocument();
  });

  it('renders language selection initially', () => {
    render(<Landing />);
    expect(screen.getByText('Select Your Language')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Spanish')).toBeInTheDocument();
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
    expect(screen.getByText(/english/i)).toBeInTheDocument();
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
