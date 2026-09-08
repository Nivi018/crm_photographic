import {
  ARTICLE_PAGE_SIZE,
  InventoryErrorCode,
  type PaginatedResponse,
} from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';

describe('shared inventory contracts', () => {
  it('uses the shared pagination and error contract', () => {
    const response: PaginatedResponse<string> = {
      items: [],
      page: 1,
      pageSize: ARTICLE_PAGE_SIZE,
      totalItems: 0,
      totalPages: 0,
    };

    expect(response.pageSize).toBe(25);
    expect(InventoryErrorCode.Validation).toBe('VALIDATION_ERROR');
  });
});
