import type { ApiPaginatedResponse, CategoryResponse } from '@crm-photografy/shared';
import { describe, expect, it, vi } from 'vitest';
import { reconcileCategoryMutation } from './reconcile-category-mutation';

function response(
  data: CategoryResponse[],
  page: number,
  totalPages: number,
): ApiPaginatedResponse<CategoryResponse> {
  return { data, meta: { page, pageSize: 25, totalItems: data.length, totalPages } };
}

describe('reconcileCategoryMutation', () => {
  it('loads all pages before confirming the mutation result', async () => {
    const listCategories = vi
      .fn()
      .mockResolvedValueOnce(response([], 1, 2))
      .mockResolvedValueOnce(
        response([{ id: 'category-1', isActive: true, name: 'Papel', version: 2 }], 2, 2),
      );

    await expect(
      reconcileCategoryMutation({ kind: 'create', name: 'Papel' }, { listCategories }),
    ).resolves.toEqual({ currentData: 'Papel; activa; version 2.', outcome: 'applied' });
    expect(listCategories).toHaveBeenNthCalledWith(2, { page: 2 });
  });

  it('keeps the outcome unresolved when a later page cannot be loaded', async () => {
    const listCategories = vi
      .fn()
      .mockResolvedValueOnce(response([], 1, 2))
      .mockRejectedValueOnce(new Error('offline'));

    await expect(
      reconcileCategoryMutation({ kind: 'create', name: 'Papel' }, { listCategories }),
    ).rejects.toThrow('offline');
  });
});
