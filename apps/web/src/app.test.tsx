import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './app';

describe('App', () => {
  it('renders the prepared workspace shell', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'El espacio de trabajo esta listo.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Frontend operativo')).toBeInTheDocument();
  });
});
