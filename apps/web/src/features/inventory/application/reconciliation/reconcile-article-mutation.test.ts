import { ArticleType } from '@crm-photografy/shared';
import { describe, expect, it, vi } from 'vitest';
import { reconcileArticleMutation } from './reconcile-article-mutation';

describe('reconcileArticleMutation', () => {
  it('uses the injected port to confirm a created article', async () => {
    const listArticles = vi.fn().mockResolvedValue({
      data: [
        {
          categoryId: 'category-1',
          currentStock: 3,
          hasLowStock: false,
          id: 'article-1',
          initialStock: 3,
          isActive: true,
          minimumStock: 1,
          name: 'Papel',
          type: ArticleType.InternalSupply,
          version: 1,
        },
      ],
      meta: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 },
    });

    await expect(
      reconcileArticleMutation(
        {
          input: {
            categoryId: 'category-1',
            initialStock: 3,
            minimumStock: 1,
            name: 'Papel',
            type: ArticleType.InternalSupply,
          },
          kind: 'create',
        },
        { findArticle: vi.fn(), listArticles },
      ),
    ).resolves.toEqual({ currentData: 'Papel; stock 3; version 1.', outcome: 'applied' });
  });
});
