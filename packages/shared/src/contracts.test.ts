import { describe, expect, it } from 'vitest';

import {
  ARTICLE_PAGE_SIZE,
  ArticleType,
  InventoryErrorCode,
  INVENTORY_LIMITS,
  MovementKind,
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
  });
});
