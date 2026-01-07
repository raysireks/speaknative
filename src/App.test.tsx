import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the Landing component initially', () => {
    render(<App />);
    expect(screen.getByText('SpeakNative')).toBeInTheDocument();
    // Default is English user learning Spanish
    expect(screen.getAllByText(/Learn/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Spanish/)[0]).toBeInTheDocument();
  });
});
