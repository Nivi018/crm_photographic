import {
  ArticleType,
  type ApiPaginatedResponse,
  type CategoryResponse,
} from '@crm-photografy/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ArticleFormScreen } from './article-form-screen';

const categories: ApiPaginatedResponse<CategoryResponse> = {
  data: [{ id: 'cat-1', isActive: true, name: 'Insumos', version: 1 }],
  meta: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 },
};

describe('ArticleFormScreen', () => {
  it('submits a valid article using active categories only', async () => {
    const createArticle = vi.fn().mockResolvedValue({});
    render(
      <ArticleFormScreen
        categoryClient={{ listCategories: vi.fn().mockResolvedValue(categories) }}
        client={{ createArticle, updateArticle: vi.fn() }}
      />,
    );
    await screen.findByRole('option', { name: 'Insumos' });
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Papel' } });
    fireEvent.change(screen.getByLabelText('Tipo'), {
      target: { value: ArticleType.InternalSupply },
    });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'cat-1' } });
    fireEvent.change(screen.getByLabelText('Stock inicial'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Stock minimo'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar articulo' }));
    await waitFor(() => expect(createArticle).toHaveBeenCalled());
    expect(screen.getByRole('status')).toHaveTextContent('Articulo creado correctamente.');
  });
});
