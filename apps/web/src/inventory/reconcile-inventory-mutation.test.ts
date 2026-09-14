import { type ApiPaginatedResponse, type CategoryResponse } from '@crm-photografy/shared';
import { describe, expect, it, vi } from 'vitest';
import { reconcileCategoryMutation } from './reconcile-inventory-mutation';

function category(id: string, name: string, version: number, isActive = true): CategoryResponse {
  return { id, isActive, name, version };
}

function response(
  data: CategoryResponse[],
  page: number,
  totalPages: number,
): ApiPaginatedResponse<CategoryResponse> {
  return {
    data,
    meta: { page, pageSize: 25, totalItems: data.length, totalPages },
  };
}

describe('reconcileCategoryMutation', () => {
  it('loads every category page before confirming a mutation', async () => {
    const listCategories = vi
      .fn()
      .mockResolvedValueOnce(response([category('category-1', 'Marco', 1)], 1, 2))
      .mockResolvedValueOnce(response([category('category-2', 'Papel', 2)], 2, 2));

    const decision = await reconcileCategoryMutation(
      { kind: 'create', name: 'Papel' },
      { listCategories },
    );

    expect(listCategories).toHaveBeenNthCalledWith(1, { page: 1 });
    expect(listCategories).toHaveBeenNthCalledWith(2, { page: 2 });
    expect(decision).toEqual({
      currentData: 'Papel; activa; version 2.',
      outcome: 'applied',
    });
  });

  it('propagates a later-page failure instead of deciding from an incomplete catalog', async () => {
    const listCategories = vi
      .fn()
      .mockResolvedValueOnce(response([category('category-1', 'Marco', 1)], 1, 2))
      .mockRejectedValueOnce(new Error('offline'));

    await expect(
      reconcileCategoryMutation({ kind: 'create', name: 'Papel' }, { listCategories }),
    ).rejects.toThrow('offline');
    expect(listCategories).toHaveBeenNthCalledWith(2, { page: 2 });
  });
});
