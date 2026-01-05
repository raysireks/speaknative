import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the Landing component initially', () => {
    render(<App />);
    expect(screen.getByText('SpeakNative')).toBeInTheDocument();
    expect(screen.getByText('Choose Your Language & Locale')).toBeInTheDocument();
  });

  it('navigates to Learning page when start learning is clicked', () => {
    render(<App />);

    // Select language and locale
    fireEvent.click(screen.getByLabelText('Select English'));
    fireEvent.click(screen.getByLabelText('Select United States - Midwest'));

    // Click Start Learning
    fireEvent.click(screen.getByLabelText('Start learning'));

    // Should now show Learning page
    expect(screen.getByText('Learning English')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('navigates back to Landing page from Learning page', () => {
    render(<App />);

    // Navigate to Learning page
    fireEvent.click(screen.getByLabelText('Select Spanish'));
    fireEvent.click(screen.getByLabelText('Select Colombia - Cartagena'));
    fireEvent.click(screen.getByLabelText('Start learning'));

    expect(screen.getByText('Learning Spanish')).toBeInTheDocument();

    // Go back
    fireEvent.click(screen.getByLabelText('Back to home'));

    // Should be back at Landing
    expect(screen.getByText('SpeakNative')).toBeInTheDocument();
    expect(screen.getByText('Choose Your Language & Locale')).toBeInTheDocument();
  });
});
