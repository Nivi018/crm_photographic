import { useSyncExternalStore, type ReactElement } from 'react';
import { ArticleListScreen } from './inventory/article-list-screen';
import { ArticleEditScreen, ArticleFormScreen } from './inventory/article-form-screen';
import { ArticleDetailScreen } from './inventory/article-detail-screen';
import { CategoryManagementScreen } from './inventory/category-management-screen';
import { MovementFormScreen } from './inventory/movement-form-screen';
import { MovementListScreen } from './inventory/movement-list-screen';

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
  if (path === '/inventory') return <ArticleListScreen />;
  if (path === '/inventory/categories') return <CategoryManagementScreen />;
  if (path === '/inventory/movements') return <MovementListScreen />;
  if (path === '/inventory/articles/new') return <ArticleFormScreen />;
  const movementMatch = path.match(/^\/inventory\/articles\/([^/]+)\/movements\/new$/);
  if (movementMatch?.[1]) return <MovementFormScreen articleId={movementMatch[1]} />;
  const editMatch = path.match(/^\/inventory\/articles\/([^/]+)\/edit$/);
  if (editMatch?.[1]) return <ArticleEditScreen articleId={editMatch[1]} />;
  const detailMatch = path.match(/^\/inventory\/articles\/([^/]+)$/);
  if (detailMatch?.[1]) return <ArticleDetailScreen articleId={detailMatch[1]} />;
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
