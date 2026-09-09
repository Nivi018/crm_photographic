import { Component, type ErrorInfo, type ReactElement, type ReactNode } from 'react';
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
        <nav aria-label="Navegacion principal" className="app-nav">
          <a href="/inventory">Inventario</a>
          <a href="/inventory/categories">Categorias</a>
          <a href="/inventory/movements">Movimientos</a>
        </nav>
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

      <InventoryErrorBoundary>
        <InventoryRouter />
      </InventoryErrorBoundary>
    </div>
  );
}

class InventoryErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    void error;
    void info;
  }
  render(): ReactNode {
    return this.state.failed ? (
      <main className="startup-panel" role="alert">
        <h1>No se pudo mostrar esta vista</h1>
        <p>Recarga la pagina o vuelve al inventario para intentarlo nuevamente.</p>
        <a href="/inventory">Volver al inventario</a>
      </main>
    ) : (
      this.props.children
    );
  }
}
