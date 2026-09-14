import { ArticleType } from '@crm-photografy/shared';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UncertainMutationError } from '../../../../inventory/api-client';
import { useArticleDetail } from './use-article-detail';

const article = {
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
};

describe('useArticleDetail', () => {
  it('loads the article and its history through the injected port', async () => {
    const findArticle = vi.fn().mockResolvedValue({ data: article });
    const listArticleMovements = vi.fn().mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 25, totalItems: 0, totalPages: 1 },
    });
    const { result } = renderHook(() =>
      useArticleDetail('article-1', {
        deactivateArticle: vi.fn(),
        deleteArticle: vi.fn(),
        findArticle,
        listArticleMovements,
        listArticles: vi.fn(),
        reactivateArticle: vi.fn(),
      }),
    );

    await waitFor(() => expect(result.current.article).toEqual(article));
    expect(listArticleMovements).toHaveBeenCalledWith('article-1', 1);
  });

  it('preserves the same history query when retrying after an error', async () => {
    const listArticleMovements = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue({
        data: [],
        meta: { page: 1, pageSize: 25, totalItems: 0, totalPages: 1 },
      });
    const { result } = renderHook(() =>
      useArticleDetail('article-1', {
        deactivateArticle: vi.fn(),
        deleteArticle: vi.fn(),
        findArticle: vi.fn().mockResolvedValue({ data: article }),
        listArticleMovements,
        listArticles: vi.fn(),
        reactivateArticle: vi.fn(),
      }),
    );

    await waitFor(() => expect(result.current.historyError).not.toBeNull());
    await result.current.reloadHistory();
    expect(listArticleMovements).toHaveBeenLastCalledWith('article-1', 1);
  });

  it('reconciles an uncertain state mutation with the injected port', async () => {
    const findArticle = vi
      .fn()
      .mockResolvedValueOnce({ data: article })
      .mockResolvedValueOnce({ data: { ...article, isActive: false, version: 2 } });
    const deactivateArticle = vi
      .fn()
      .mockRejectedValue(new UncertainMutationError('Resultado incierto.'));
    const { result } = renderHook(() =>
      useArticleDetail('article-1', {
        deactivateArticle,
        deleteArticle: vi.fn(),
        findArticle,
        listArticleMovements: vi.fn().mockResolvedValue({
          data: [],
          meta: { page: 1, pageSize: 25, totalItems: 0, totalPages: 1 },
        }),
        listArticles: vi.fn(),
        reactivateArticle: vi.fn(),
      }),
    );

    await waitFor(() => expect(result.current.article).toEqual(article));
    await act(async () => result.current.toggleArticleState(article));
    await waitFor(() => expect(result.current.reconciliation.phase).toBe('applied'));
    expect(findArticle).toHaveBeenCalledTimes(3);
  });
});
