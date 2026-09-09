import type { ReactElement } from 'react';
import { InventoryRouter } from './router';
import { useTheme } from './theme';

export function App(): ReactElement {
  const { message, theme, toggleTheme } = useTheme();

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
        <div className="theme-control">
          <button
            aria-label="Cambiar tema"
            className="theme-button"
            onClick={toggleTheme}
            type="button"
          >
            Tema {theme === 'light' ? 'oscuro' : 'claro'}
          </button>
          {message ? <p role="status">{message}</p> : null}
        </div>
      </header>

      <InventoryRouter />
    </div>
  );
}
