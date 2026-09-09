import { ArticleType, type PaginatedResponse } from '@crm-photografy/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ArticleRecord } from './api-client';
import { ArticleListScreen } from './article-list-screen';

const response: PaginatedResponse<ArticleRecord> = {
  items: [
    {
      entity: {
        categoryId: 'cat-1',
        currentStock: 2,
        id: 'article-1',
        isActive: true,
        minimumStock: 2,
        name: 'Papel fotografico',
        type: ArticleType.InternalSupply,
      },
      version: 1,
    },
  ],
  page: 1,
  pageSize: 25,
  totalItems: 1,
  totalPages: 1,
};

describe('ArticleListScreen', () => {
  it('filters articles and identifies active low-stock items', async () => {
    const listArticles = vi.fn().mockResolvedValue(response);
    render(<ArticleListScreen client={{ listArticles }} />);

    expect(await screen.findByText('Papel fotografico')).toBeInTheDocument();
    expect(screen.getByText('Stock bajo')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Buscar por nombre'), { target: { value: 'papel' } });
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'false' } });

    await waitFor(() =>
      expect(listArticles).toHaveBeenLastCalledWith({ isActive: false, name: 'papel', page: 1 }),
    );
  });
});
