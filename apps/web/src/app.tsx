import type { ReactElement } from 'react';

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

      <main className="startup-panel">
        <div className="startup-rule" />
        <p className="startup-status">Frontend operativo</p>
        <h1>El espacio de trabajo esta listo.</h1>
        <p className="startup-copy">
          El inventario del estudio se habilitara al completar los modulos aprobados.
        </p>
      </main>
    </div>
  );
}
