import { describe, expect, it } from 'vitest';

import {
  ArticleHasMovementsError,
  ArticleInactiveError,
  ArticleNameTooLongError,
  ArticleStockNotZeroError,
  CategoryInactiveError,
  InvalidArticleTypeError,
  InvalidMovementCountError,
} from './articles/article.errors';
import { type ArticleProperties } from './articles/article.properties';
import {
  ActiveArticleAssociationError,
  CategoryAssociationError,
  CategoryNameTooLongError,
  InvalidArticleAssociationCountError,
} from './categories/category.errors';
import { type CategoryProperties } from './categories/category.properties';
import { MovementReasonTooLongError, NoStockDifferenceError } from './stock/movement.errors';
import { type PersistedMovementProperties } from './stock/movement.properties';
import { InvalidQuantityError, StockOutOfRangeError } from './stock/quantity.errors';
import { RequiredTextError } from './text/text.errors';
import { type RequiredTextField } from './text/text.properties';

describe('inventory domain modules', () => {
  it('keeps entity properties and errors in dedicated modules', () => {
    const article: Pick<ArticleProperties, 'id' | 'isActive'> = {
      id: 'article-1',
      isActive: false,
    };
    const category: Pick<CategoryProperties, 'id' | 'isActive'> = {
      id: 'category-1',
      isActive: true,
    };
    const movement: Pick<PersistedMovementProperties, 'id' | 'sequence'> = {
      id: 'movement-1',
      sequence: 1n,
    };
    const field: RequiredTextField = 'name';

    expect(article.isActive).toBe(false);
    expect(category.isActive).toBe(true);
    expect(movement.sequence).toBe(1n);
    expect(new RequiredTextError(field).name).toBe('RequiredTextError');
    expect(new ArticleNameTooLongError().name).toBe('ArticleNameTooLongError');
    expect(new InvalidArticleTypeError().name).toBe('InvalidArticleTypeError');
    expect(new CategoryInactiveError().name).toBe('CategoryInactiveError');
    expect(new ArticleInactiveError().name).toBe('ArticleInactiveError');
    expect(new ArticleHasMovementsError().name).toBe('ArticleHasMovementsError');
    expect(new ArticleStockNotZeroError().name).toBe('ArticleStockNotZeroError');
    expect(new InvalidMovementCountError().name).toBe('InvalidMovementCountError');
    expect(new CategoryNameTooLongError().name).toBe('CategoryNameTooLongError');
    expect(new ActiveArticleAssociationError().name).toBe('ActiveArticleAssociationError');
    expect(new CategoryAssociationError().name).toBe('CategoryAssociationError');
    expect(new InvalidArticleAssociationCountError().name).toBe(
      'InvalidArticleAssociationCountError',
    );
    expect(new MovementReasonTooLongError().name).toBe('MovementReasonTooLongError');
    expect(new NoStockDifferenceError().name).toBe('NoStockDifferenceError');
    expect(new InvalidQuantityError('quantity').name).toBe('InvalidQuantityError');
    expect(new StockOutOfRangeError().name).toBe('StockOutOfRangeError');
  });
});
