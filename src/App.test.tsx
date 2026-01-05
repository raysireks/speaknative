import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />);
    expect(screen.getByText('SpeakNative')).toBeInTheDocument();
  });

  it('renders the counter button', () => {
    render(<App />);
    expect(screen.getByText(/Count is 0/i)).toBeInTheDocument();
  });

  it('increments counter when button is clicked', () => {
    render(<App />);
    const button = screen.getByText(/Count is 0/i);
    fireEvent.click(button);
    expect(screen.getByText(/Count is 1/i)).toBeInTheDocument();
  });
});
