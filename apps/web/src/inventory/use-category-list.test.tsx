import { type ApiPaginatedResponse, type CategoryResponse } from '@crm-photografy/shared';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCategoryList } from './use-category-list';

const page: ApiPaginatedResponse<CategoryResponse> = {
  data: [],
  meta: { page: 1, pageSize: 25, totalItems: 0, totalPages: 0 },
};

describe('useCategoryList', () => {
  it('preserves the active-state filter and returns to the first page when it changes', async () => {
    const listCategories = vi.fn().mockResolvedValue(page);
    const { result } = renderHook(() => useCategoryList({ listCategories }));

    await waitFor(() => expect(listCategories).toHaveBeenCalledWith({ page: 1 }));
    act(() => result.current.setPage(2));
    await waitFor(() => expect(listCategories).toHaveBeenLastCalledWith({ page: 2 }));

    act(() => result.current.updateState(false));

    await waitFor(() =>
      expect(listCategories).toHaveBeenLastCalledWith({ isActive: false, page: 1 }),
    );
    expect(result.current.page).toBe(1);
  });

  it('exposes a recoverable loading error', async () => {
    const { result } = renderHook(() =>
      useCategoryList({ listCategories: vi.fn().mockRejectedValue(new Error('offline')) }),
    );

    await waitFor(() => expect(result.current.error).toContain('No se pudieron cargar'));
    expect(result.current.isLoading).toBe(false);
  });
});
