import { ArticleType, ARTICLE_PAGE_SIZE, type PaginatedResponse } from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';

import type { ArticleRepository } from './article-repository.port';
import type { CategoryRepository } from './category-repository.port';
import type { InventoryUnitOfWork } from './inventory-unit-of-work.port';
import type { MovementRepository } from './movement-repository.port';
import type { Versioned } from './repository-types.port';
import { Article } from '../../domain/articles/article';
import { Category } from '../../domain/categories/category';
import { Movement } from '../../domain/stock/movement';

describe('inventory application ports', () => {
  it('groups category, article, and movement repositories in a transaction boundary', async () => {
    const categories: CategoryRepository = {
      findById: async () => null,
      findByNormalizedName: async () => null,
      countArticleAssociations: async () => ({ active: 0, inactive: 0 }),
      save: async () => {
        throw new Error('not used in this test');
      },
      delete: async () => undefined,
      list: async () => emptyPage<Versioned<Category>>(),
    };
    const articles: ArticleRepository = {
      findById: async () => null,
      findByNormalizedName: async () => null,
      save: async () => {
        throw new Error('not used in this test');
      },
      delete: async () => undefined,
      list: async () => emptyPage<Versioned<Article>>(),
      listLowStock: async () => emptyPage<Versioned<Article>>(),
    };
    const movements: MovementRepository = {
      nextSequence: async () => 1n,
      append: async () => undefined,
      countByArticleId: async () => 0,
      list: async () => emptyPage<Movement>(),
    };
    const unitOfWork: InventoryUnitOfWork = {
      execute: async (operation) => operation({ categories, articles, movements }),
    };

    const result = await unitOfWork.execute(async (repositories) => ({
      categories: await repositories.categories.list({ page: 1 }),
      articles: await repositories.articles.list({ page: 1, type: ArticleType.Sale }),
      movements: await repositories.movements.list({ page: 1, articleId: 'article-1' }),
      sequence: await repositories.movements.nextSequence(),
    }));

    expect(result.categories.pageSize).toBe(ARTICLE_PAGE_SIZE);
    expect(result.articles.items).toEqual([]);
    expect(result.movements.totalItems).toBe(0);
    expect(result.sequence).toBe(1n);
  });
});

function emptyPage<T>(): PaginatedResponse<T> {
  return { items: [] as T[], page: 1, pageSize: ARTICLE_PAGE_SIZE, totalItems: 0, totalPages: 0 };
}
