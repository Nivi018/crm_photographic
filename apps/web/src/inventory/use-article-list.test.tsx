import {
  ArticleType,
  type ApiPaginatedResponse,
  type ArticleResponse,
} from '@crm-photografy/shared';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useArticleList } from './use-article-list';

const page: ApiPaginatedResponse<ArticleResponse> = {
  data: [],
  meta: { page: 1, pageSize: 25, totalItems: 0, totalPages: 0 },
};

describe('useArticleList', () => {
  it('loads with active filters and returns to the first page when they change', async () => {
    const listArticles = vi.fn().mockResolvedValue(page);
    const { result } = renderHook(() => useArticleList({ listArticles }));

    await waitFor(() => expect(listArticles).toHaveBeenCalledWith({ name: '', page: 1 }));
    act(() => result.current.setPage(2));
    await waitFor(() => expect(listArticles).toHaveBeenLastCalledWith({ name: '', page: 2 }));
    act(() => result.current.updateFilters({ type: ArticleType.Sale }));

    await waitFor(() =>
      expect(listArticles).toHaveBeenLastCalledWith({
        name: '',
        page: 1,
        type: ArticleType.Sale,
      }),
    );
    expect(result.current.page).toBe(1);
  });

  it('exposes a recoverable loading error', async () => {
    const { result } = renderHook(() =>
      useArticleList({ listArticles: vi.fn().mockRejectedValue(new Error('offline')) }),
    );

    await waitFor(() => expect(result.current.error).toContain('No se pudo cargar'));
    expect(result.current.isLoading).toBe(false);
  });
});
