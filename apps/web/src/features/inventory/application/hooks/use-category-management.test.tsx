import type { CategoryResponse } from '@crm-photografy/shared';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UncertainMutationError } from '../../../../inventory/api-client';
import { type CategoryManagementClient, useCategoryManagement } from './use-category-management';

const category: CategoryResponse = { id: 'category-1', isActive: true, name: 'Papel', version: 1 };
const page = { data: [category], meta: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 } };

describe('useCategoryManagement', () => {
  it('keeps the active filter when reloading the injected query', async () => {
    const listCategories = vi.fn().mockResolvedValue(page);
    const { result } = renderHook(() => useCategoryManagement(client(listCategories)));
    await waitFor(() => expect(listCategories).toHaveBeenCalledWith({ page: 1 }));

    act(() => result.current.updateState(false));
    await waitFor(() =>
      expect(listCategories).toHaveBeenLastCalledWith({ isActive: false, page: 1 }),
    );
  });

  it('blocks an uncertain mutation while reconciling with the same port', async () => {
    const listCategories = vi
      .fn()
      .mockResolvedValueOnce(page)
      .mockResolvedValueOnce({
        data: [{ ...category, isActive: false, version: 2 }],
        meta: page.meta,
      })
      .mockResolvedValueOnce({
        data: [{ ...category, isActive: false, version: 2 }],
        meta: page.meta,
      });
    const deactivateCategory = vi
      .fn()
      .mockRejectedValue(new UncertainMutationError('Resultado incierto.'));
    const { result } = renderHook(() =>
      useCategoryManagement(client(listCategories, deactivateCategory)),
    );
    await waitFor(() => expect(result.current.result).not.toBeNull());

    await act(async () => result.current.toggleCategoryState(category));
    await waitFor(() => expect(result.current.reconciliation.phase).toBe('applied'));
    expect(deactivateCategory).toHaveBeenCalledWith('category-1', 1);
  });
});

function client(
  listCategories: CategoryManagementClient['listCategories'],
  deactivateCategory: CategoryManagementClient['deactivateCategory'] = vi.fn(),
): CategoryManagementClient {
  return {
    createCategory: vi.fn(),
    deactivateCategory,
    deleteCategory: vi.fn(),
    listCategories,
    reactivateCategory: vi.fn(),
    updateCategory: vi.fn(),
  };
}
