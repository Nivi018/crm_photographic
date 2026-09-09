import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './app';

describe('App', () => {
  it('renders the inventory route', () => {
    window.history.replaceState({}, '', '/inventory');
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
    expect(
      screen.getByText('Consulta existencias y localiza articulos del estudio.'),
    ).toBeInTheDocument();
  });
});
