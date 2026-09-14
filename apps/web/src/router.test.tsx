import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./inventory/article-list-screen', () => ({
  ArticleListScreen: () => <h1>Lista de articulos</h1>,
}));
vi.mock('./inventory/article-form-screen', () => ({
  ArticleEditScreen: ({ articleId }: { articleId: string }) => <h1>Editar {articleId}</h1>,
  ArticleFormScreen: () => <h1>Nuevo articulo</h1>,
}));
vi.mock('./inventory/article-detail-screen', () => ({
  ArticleDetailScreen: ({ articleId }: { articleId: string }) => <h1>Detalle {articleId}</h1>,
}));
vi.mock('./inventory/category-management-screen', () => ({
  CategoryManagementScreen: () => <h1>Categorias</h1>,
}));
vi.mock('./inventory/movement-form-screen', () => ({
  MovementFormScreen: ({ articleId }: { articleId: string }) => <h1>Movimiento {articleId}</h1>,
}));
vi.mock('./inventory/movement-list-screen', () => ({
  MovementListScreen: () => <h1>Movimientos</h1>,
}));
vi.mock('./inventory/low-stock-screen', () => ({
  LowStockScreen: () => <h1>Stock bajo</h1>,
}));

import { InventoryRouter } from './router';

describe('InventoryRouter', () => {
  beforeEach(() => window.history.replaceState({}, '', '/inventory'));

  it.each([
    ['/inventory', 'Lista de articulos'],
    ['/inventory/categories', 'Categorias'],
    ['/inventory/movements', 'Movimientos'],
    ['/inventory/low-stock', 'Stock bajo'],
    ['/inventory/articles/new', 'Nuevo articulo'],
    ['/inventory/articles/article-1', 'Detalle article-1'],
    ['/inventory/articles/article-1/edit', 'Editar article-1'],
    ['/inventory/articles/article-1/movements/new', 'Movimiento article-1'],
  ])('renders the existing route %s', (path, heading) => {
    window.history.replaceState({}, '', path);

    render(<InventoryRouter />);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  });
});
