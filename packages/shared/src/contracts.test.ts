import { describe, expect, it } from 'vitest';

import {
  ARTICLE_PAGE_SIZE,
  ArticleType,
  InventoryErrorCode,
  INVENTORY_LIMITS,
  type ApiErrorResponse,
  type ApiPaginatedResponse,
  type ApiResponse,
  type ArticleResponse,
  type MovementOperationResponse,
  MovementKind,
  MovementSource,
} from './index.js';

describe('shared inventory contracts', () => {
  it('publishes the inventory values defined by the specification', () => {
    expect(ArticleType.Sale).toBe('SALE');
    expect(MovementKind.Adjustment).toBe('ADJUSTMENT');
    expect(ARTICLE_PAGE_SIZE).toBe(25);
    expect(INVENTORY_LIMITS.maximumQuantity).toBe(999_999_999);
    expect(InventoryErrorCode.NegativeStockConfirmationRequired).toBe(
      'NEGATIVE_STOCK_CONFIRMATION_REQUIRED',
    );
    expect(InventoryErrorCode.Internal).toBe('INTERNAL_ERROR');
    expect(InventoryErrorCode.ServiceUnavailable).toBe('SERVICE_UNAVAILABLE');
  });

  it('defines public resource and envelope shapes without internal fields', () => {
    const article: ArticleResponse = {
      id: '11111111-1111-4111-8111-111111111111',
      categoryId: '22222222-2222-4222-8222-222222222222',
      name: 'Papel fotografico',
      type: ArticleType.Sale,
      initialStock: 0,
      currentStock: 0,
      minimumStock: 0,
      isActive: false,
      hasLowStock: false,
      version: 0,
    };
    const single: ApiResponse<ArticleResponse> = { data: article };
    const page: ApiPaginatedResponse<ArticleResponse> = {
      data: [article],
      meta: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 },
    };

    expect(Object.keys(single.data)).toEqual([
      'id',
      'categoryId',
      'name',
      'type',
      'initialStock',
      'currentStock',
      'minimumStock',
      'isActive',
      'hasLowStock',
      'version',
    ]);
    expect(page).toEqual({
      data: [article],
      meta: { page: 1, pageSize: 25, totalItems: 1, totalPages: 1 },
    });
  });

  it('preserves nullable adjustment modes and error details', () => {
    const response: ApiResponse<MovementOperationResponse> = {
      data: {
        article: {
          id: '11111111-1111-4111-8111-111111111111',
          categoryId: '22222222-2222-4222-8222-222222222222',
          name: 'Papel fotografico',
          type: ArticleType.Sale,
          initialStock: 0,
          currentStock: -1,
          minimumStock: 0,
          isActive: false,
          hasLowStock: true,
          version: 0,
        },
        movement: {
          id: '33333333-3333-4333-8333-333333333333',
          articleId: '11111111-1111-4111-8111-111111111111',
          sequence: '9007199254740992',
          kind: MovementKind.Entry,
          source: MovementSource.Manual,
          adjustmentMode: null,
          appliedQuantity: 0,
          stockBefore: -1,
          stockAfter: -1,
          reason: '',
          occurredAt: '2026-09-10T12:00:00.000Z',
        },
      },
    };
    const error: ApiErrorResponse = {
      code: InventoryErrorCode.NegativeStockConfirmationRequired,
      message: 'Confirmation required',
      statusCode: 400,
      details: { stockAfter: -1 },
    };

    expect(response.data.movement.adjustmentMode).toBeNull();
    expect(response.data.article.isActive).toBe(false);
    expect(error.details).toEqual({ stockAfter: -1 });
  });
});
