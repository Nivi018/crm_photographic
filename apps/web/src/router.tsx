import { useSyncExternalStore, type ReactElement } from 'react';

export type InventoryRoute = '/inventory' | '/inventory/categories' | '/inventory/movements';

const routes: Record<InventoryRoute, { description: string; title: string }> = {
  '/inventory': {
    description: 'Consulta y administra los articulos del estudio.',
    title: 'Inventario',
  },
  '/inventory/categories': {
    description: 'Organiza las categorias disponibles.',
    title: 'Categorias',
  },
  '/inventory/movements': {
    description: 'Revisa el historial de existencias.',
    title: 'Movimientos',
  },
};

export function InventoryRouter(): ReactElement {
  const path = useSyncExternalStore(subscribeToLocation, currentPath, currentPath);
  const route = routes[path as InventoryRoute] ?? routes['/inventory'];

  return (
    <main className="startup-panel">
      <p className="startup-status">Modulo de inventario</p>
      <h1>{route.title}</h1>
      <p className="startup-copy">{route.description}</p>
    </main>
  );
}

function currentPath(): string {
  return window.location.pathname;
}

function subscribeToLocation(listener: () => void): () => void {
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
}
