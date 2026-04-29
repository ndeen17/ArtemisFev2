import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders as <button> by default', () => {
    render(<Button>Click me</Button>);
    const el = screen.getByRole('button', { name: /click me/i });
    expect(el).toBeInTheDocument();
    expect(el.tagName).toBe('BUTTON');
  });

  it('renders as <a> when href is provided', () => {
    render(<Button href="/start">Get started</Button>);
    const el = screen.getByRole('link', { name: /get started/i });
    expect(el).toBeInTheDocument();
    expect(el.tagName).toBe('A');
    expect(el).toHaveAttribute('href', '/start');
  });

  it.each(['primary', 'outline', 'ghost'] as const)('applies %s variant classes', (variant) => {
    render(<Button variant={variant}>Hi</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
