import { ArticleType, INVENTORY_LIMITS } from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';

import { Article } from './article';
import {
  ArticleHasMovementsError,
  ArticleInactiveError,
  ArticleNameTooLongError,
  ArticleStockNotZeroError,
  CategoryInactiveError,
  InvalidArticleTypeError,
} from './article.errors';
import { RequiredTextError } from '../text/text.errors';

const activeCategory = { id: 'category-1', isActive: true };
const inactiveCategory = { id: 'category-2', isActive: false };

function createArticle(): Article {
  return Article.create({
    id: 'article-1',
    name: '  Ca\u0301mara principal  ',
    type: ArticleType.Sale,
    category: activeCategory,
    initialStock: 5,
    minimumStock: 2,
  });
}

describe('Article', () => {
  it('creates an active article with a trimmed, normalized name and zero current stock', () => {
    const article = createArticle();

    expect(article.name).toBe('Ca\u0301mara principal');
    expect(article.normalizedName).toBe('camara principal');
    expect(article.type).toBe(ArticleType.Sale);
    expect(article.categoryId).toBe(activeCategory.id);
    expect(article.initialStock).toBe(5);
    expect(article.currentStock).toBe(0);
    expect(article.minimumStock).toBe(2);
    expect(article.isActive).toBe(true);
  });

  it('supports both supported article classifications', () => {
    const article = Article.create({
      id: 'article-1',
      name: 'Fondo',
      type: ArticleType.InternalSupply,
      category: activeCategory,
      initialStock: 0,
      minimumStock: 0,
    });

    expect(article.type).toBe(ArticleType.InternalSupply);
  });

  it('rejects a missing, overlong, or unsupported article type or name', () => {
    expect(() => Article.create({ ...articleInput(), name: ' \t ' })).toThrow(RequiredTextError);
    expect(() =>
      Article.create({
        ...articleInput(),
        name: 'a'.repeat(INVENTORY_LIMITS.maximumArticleNameLength + 1),
      }),
    ).toThrow(ArticleNameTooLongError);
    expect(() => Article.create({ ...articleInput(), type: 'OTHER' as ArticleType })).toThrow(
      InvalidArticleTypeError,
    );
  });

  it('requires an active category to create or edit an article', () => {
    expect(() => Article.create({ ...articleInput(), category: inactiveCategory })).toThrow(
      CategoryInactiveError,
    );

    const article = createArticle();
    expect(() => article.edit({ ...articleEditInput(), category: inactiveCategory })).toThrow(
      CategoryInactiveError,
    );
  });

  it('edits all mutable article fields while active', () => {
    const article = createArticle();

    article.edit({
      name: '  Tripo\u0301de  ',
      type: ArticleType.InternalSupply,
      category: { id: 'category-3', isActive: true },
      initialStock: 10,
      minimumStock: 4,
    });

    expect(article.name).toBe('Tripo\u0301de');
    expect(article.normalizedName).toBe('tripode');
    expect(article.type).toBe(ArticleType.InternalSupply);
    expect(article.categoryId).toBe('category-3');
    expect(article.initialStock).toBe(10);
    expect(article.minimumStock).toBe(4);
    expect(article.currentStock).toBe(0);
  });

  it('blocks edits and movements while inactive', () => {
    const article = createArticle();
    article.deactivate();

    expect(() => article.edit(articleEditInput())).toThrow(ArticleInactiveError);
    expect(() => article.assertCanReceiveMovement()).toThrow(ArticleInactiveError);
  });

  it('reactivates with an active category and can replace an inactive category', () => {
    const article = Article.rehydrate({
      ...articleInput(),
      categoryId: inactiveCategory.id,
      currentStock: 0,
      isActive: false,
    });

    expect(() => article.reactivate(inactiveCategory)).toThrow(CategoryInactiveError);

    article.reactivate(activeCategory);

    expect(article.isActive).toBe(true);
    expect(article.categoryId).toBe(activeCategory.id);
  });

  it('identifies low stock only for active articles', () => {
    const article = Article.rehydrate({
      ...articleInput(),
      categoryId: activeCategory.id,
      currentStock: 2,
      minimumStock: 2,
      isActive: true,
    });

    expect(article.hasLowStock).toBe(true);

    article.deactivate();
    expect(article.hasLowStock).toBe(false);
  });

  it('allows deletion only when current stock is zero and no movements exist', () => {
    const deletable = createArticle();
    expect(() => deletable.assertCanBeDeleted(0)).not.toThrow();

    expect(() => deletable.assertCanBeDeleted(1)).toThrow(ArticleHasMovementsError);

    const withStock = Article.rehydrate({
      ...articleInput(),
      categoryId: activeCategory.id,
      currentStock: 1,
      isActive: true,
    });
    expect(() => withStock.assertCanBeDeleted(0)).toThrow(ArticleStockNotZeroError);
  });
});

function articleInput() {
  return {
    id: 'article-1',
    name: 'Camara',
    type: ArticleType.Sale,
    category: activeCategory,
    initialStock: 0,
    minimumStock: 0,
  };
}

function articleEditInput() {
  return {
    name: 'Camara',
    type: ArticleType.Sale,
    category: activeCategory,
    initialStock: 0,
    minimumStock: 0,
  };
}
