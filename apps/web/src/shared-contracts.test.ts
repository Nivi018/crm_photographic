import { ARTICLE_PAGE_SIZE, ArticleType, INVENTORY_LIMITS } from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';

describe('shared inventory contracts', () => {
  it('uses the shared inventory enums and limits', () => {
    expect(ArticleType.InternalSupply).toBe('INTERNAL_SUPPLY');
    expect(ARTICLE_PAGE_SIZE).toBe(25);
    expect(INVENTORY_LIMITS.maximumArticleNameLength).toBe(150);
  });
});
