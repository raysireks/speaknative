import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the Landing component initially', () => {
    render(<App />);
    expect(screen.getByText('SpeakNative')).toBeInTheDocument();
    expect(screen.getByText('Choose Your Language & Locale')).toBeInTheDocument();
  });
});
