import { ArticleType } from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';
import {
  decideArticleMutation,
  decideCategoryMutation,
  decideMovementMutation,
} from './reconciliation-policy';

describe('reconciliation policy', () => {
  it('confirms an article update only when its expected values and version changed', () => {
    expect(
      decideArticleMutation(
        {
          id: 'article-1',
          input: {
            categoryId: 'category-1',
            expectedVersion: 2,
            initialStock: 4,
            minimumStock: 2,
            name: 'Papel mate',
            type: ArticleType.InternalSupply,
          },
          kind: 'update',
        },
        {
          categoryId: 'category-1',
          currentStock: 4,
          id: 'article-1',
          initialStock: 4,
          isActive: true,
          minimumStock: 2,
          name: 'Papel mate',
          type: ArticleType.InternalSupply,
          version: 3,
        },
      ),
    ).toEqual({ currentData: 'Papel mate; stock 4; version 3.', outcome: 'applied' });
  });

  it('keeps category state changes indeterminate when another update changed its version', () => {
    expect(
      decideCategoryMutation(
        { expectedVersion: 2, id: 'category-1', isActive: false, kind: 'state' },
        { id: 'category-1', isActive: true, name: 'Papel', version: 3 },
      ),
    ).toEqual({ currentData: 'Papel; activa; version 3.', outcome: 'indeterminate' });
  });

  it('recognizes a movement only when both stock and history confirm it', () => {
    expect(
      decideMovementMutation(
        { currentStock: 3, expectedVersion: 1, movementFound: true },
        { currentStock: 5, name: 'Papel', version: 2 },
      ),
    ).toEqual({ currentData: 'Papel; stock 5; version 2.', outcome: 'applied' });

    expect(
      decideMovementMutation(
        { currentStock: 3, expectedVersion: 1, movementFound: false },
        { currentStock: 3, name: 'Papel', version: 1 },
      ),
    ).toEqual({ currentData: 'Papel; stock 3; version 1.', outcome: 'not-applied' });
  });
});
