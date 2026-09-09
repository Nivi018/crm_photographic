import type { ReactElement } from 'react';
import { InventoryRouter } from './router';

export function App(): ReactElement {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div
          aria-label="Espacio reservado para la identidad TONY photography"
          className="brand-placeholder"
        >
          <span>TONY</span>
          <small>photography</small>
        </div>
        <p className="header-status">Preparacion del espacio de trabajo</p>
      </header>

      <InventoryRouter />
    </div>
  );
}
