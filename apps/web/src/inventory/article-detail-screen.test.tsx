import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ArticleDetailScreen } from './article-detail-screen';

describe('ArticleDetailScreen', () => {
  it('shows the article stock and its immutable movement history', async () => {
    const findArticle = vi.fn().mockResolvedValue({
      data: {
        categoryId: 'cat',
        currentStock: 4,
        hasLowStock: false,
        id: 'article-1',
        initialStock: 3,
        isActive: true,
        minimumStock: 1,
        name: 'Papel',
        type: 'INTERNAL_SUPPLY',
        version: 1,
      },
    });
    const listArticleMovements = vi.fn().mockResolvedValue({
      data: [
        {
          adjustmentMode: null,
          appliedQuantity: 1,
          articleId: 'article-1',
          id: 'movement-1',
          kind: 'ENTRY',
          occurredAt: '2026-01-01T10:00:00.000Z',
          reason: 'Compra',
          sequence: '1',
          source: 'MANUAL',
          stockAfter: 4,
          stockBefore: 3,
        },
      ],
      meta: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 },
    });
    render(
      <ArticleDetailScreen
        articleClient={{ findArticle }}
        articleId="article-1"
        movementClient={{ listArticleMovements }}
      />,
    );
    expect(await screen.findByRole('heading', { name: 'Papel' })).toBeInTheDocument();
    expect(screen.getByText('Compra')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    await waitFor(() => expect(listArticleMovements).toHaveBeenCalledWith('article-1', 1));
  });
});
