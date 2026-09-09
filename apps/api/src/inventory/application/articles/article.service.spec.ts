import { ArticleType, MovementSource } from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';

import {
  type ArticleListCriteria,
  type InventoryRepositories,
  type InventoryUnitOfWork,
  type Versioned,
} from '../ports/inventory-ports';
import { Article } from '../../domain/articles/article';
import { Category } from '../../domain/categories/category';
import { Movement } from '../../domain/stock/movement';
import {
  ArticleNameConflictError,
  ArticleService,
  NoActiveCategoriesError,
} from './article.service';

describe('ArticleService', () => {
  it('creates an active article and its automatic initial-stock entry in one unit of work', async () => {
    const harness = new ArticleCreationHarness();
    harness.addCategory(Category.create({ id: 'category-1', name: 'Fondos' }));
    const service = new ArticleService(harness);

    const created = await service.create({
      name: '  Fondo blanco  ',
      type: ArticleType.Sale,
      categoryId: 'category-1',
      initialStock: 4,
      minimumStock: 1,
    });

    expect(created).toMatchObject({
      version: 0,
      entity: { name: 'Fondo blanco', isActive: true, currentStock: 0 },
    });
    expect(harness.savedMovements).toHaveLength(1);
    expect(harness.savedMovements[0]).toMatchObject({
      articleId: created.entity.id,
      source: MovementSource.InitialStock,
      appliedQuantity: 4,
      reason: 'Stock inicial',
    });
  });

  it('creates no initial-stock movement when initial stock is zero', async () => {
    const harness = new ArticleCreationHarness();
    harness.addCategory(Category.create({ id: 'category-1', name: 'Fondos' }));
    const service = new ArticleService(harness);

    await service.create({
      name: 'Fondo negro',
      type: ArticleType.Sale,
      categoryId: 'category-1',
      initialStock: 0,
      minimumStock: 0,
    });

    expect(harness.savedMovements).toHaveLength(0);
  });

  it('rejects duplicate article names even when the existing article is inactive', async () => {
    const harness = new ArticleCreationHarness();
    harness.addCategory(Category.create({ id: 'category-1', name: 'Fondos' }));
    const existing = Article.rehydrate({
      id: 'article-1',
      name: 'Camaras',
      type: ArticleType.Sale,
      categoryId: 'category-1',
      initialStock: 0,
      currentStock: 0,
      minimumStock: 0,
      isActive: false,
    });
    harness.addArticle(existing);
    const service = new ArticleService(harness);

    await expect(
      service.create({
        name: '  Ca\u0301maras ',
        type: ArticleType.Sale,
        categoryId: 'category-1',
        initialStock: 0,
        minimumStock: 0,
      }),
    ).rejects.toThrow(ArticleNameConflictError);
  });

  it('blocks creation when no active categories are available', async () => {
    const harness = new ArticleCreationHarness();
    const service = new ArticleService(harness);

    await expect(
      service.create({
        name: 'Fondo blanco',
        type: ArticleType.Sale,
        categoryId: 'missing-category',
        initialStock: 0,
        minimumStock: 0,
      }),
    ).rejects.toThrow(NoActiveCategoriesError);
  });

  it('does not persist the article when storing its initial movement fails', async () => {
    const harness = new ArticleCreationHarness({ failOnMovementAppend: true });
    harness.addCategory(Category.create({ id: 'category-1', name: 'Fondos' }));
    const service = new ArticleService(harness);

    await expect(
      service.create({
        name: 'Fondo blanco',
        type: ArticleType.Sale,
        categoryId: 'category-1',
        initialStock: 1,
        minimumStock: 0,
      }),
    ).rejects.toThrow('movement append failed');

    expect(harness.savedArticles).toHaveLength(0);
  });

  it('retrieves an article by identifier, including inactive articles', async () => {
    const harness = new ArticleCreationHarness();
    const article = Article.rehydrate({
      id: 'inactive-article',
      name: 'Fondo archivado',
      type: ArticleType.Sale,
      categoryId: 'category-1',
      initialStock: 0,
      currentStock: 3,
      minimumStock: 1,
      isActive: false,
    });
    harness.addArticle(article);
    const service = new ArticleService(harness);

    await expect(service.findById(article.id)).resolves.toMatchObject({
      entity: { id: article.id, currentStock: 3, isActive: false },
    });
  });

  it('normalizes a partial name search and delegates combined filters with the requested page', async () => {
    const harness = new ArticleCreationHarness();
    const service = new ArticleService(harness);

    await service.list({
      page: 2,
      name: '  Ca\u0301mara ',
      type: ArticleType.Sale,
      categoryId: 'category-1',
      isActive: true,
    });

    expect(harness.lastArticleListCriteria).toEqual({
      page: 2,
      normalizedName: 'camara',
      type: ArticleType.Sale,
      categoryId: 'category-1',
      isActive: true,
    });
  });

  it('edits initial stock and recalculates current stock without creating a movement', async () => {
    const harness = new ArticleCreationHarness();
    const article = Article.rehydrate({
      id: 'article-edit',
      name: 'Fondo editable',
      type: ArticleType.Sale,
      categoryId: 'category-1',
      initialStock: 2,
      currentStock: 2,
      minimumStock: 0,
      isActive: true,
    });
    harness.addArticle(article);
    harness.addCategory(Category.create({ id: 'category-1', name: 'Fondos' }));
    const service = new ArticleService(harness);

    const updated = await service.edit({
      id: article.id,
      name: article.name,
      type: article.type,
      categoryId: article.categoryId,
      initialStock: 8,
      minimumStock: 0,
      expectedVersion: 0,
    });

    expect(updated.entity).toMatchObject({ initialStock: 8, currentStock: 8 });
    expect(harness.savedMovements).toHaveLength(0);
  });

  it('deactivates and reactivates an article with its active category', async () => {
    const harness = new ArticleCreationHarness();
    const article = activeArticle('article-state');
    harness.addArticle(article);
    harness.addCategory(Category.create({ id: 'category-1', name: 'Fondos' }));
    const service = new ArticleService(harness);

    await expect(service.deactivate({ id: article.id, expectedVersion: 0 })).resolves.toMatchObject(
      {
        entity: { isActive: false },
      },
    );
    await expect(service.reactivate({ id: article.id, expectedVersion: 0 })).resolves.toMatchObject(
      {
        entity: { isActive: true, categoryId: 'category-1' },
      },
    );
  });

  it('deletes an article only when it has zero stock and no movements', async () => {
    const harness = new ArticleCreationHarness();
    const article = activeArticle('article-delete');
    harness.addArticle(article);
    const service = new ArticleService(harness);

    await service.delete({ id: article.id, expectedVersion: 0 });

    await expect(service.findById(article.id)).resolves.toBeNull();
  });
});

function activeArticle(id: string): Article {
  return Article.rehydrate({
    id,
    name: 'Articulo activo',
    type: ArticleType.Sale,
    categoryId: 'category-1',
    initialStock: 0,
    currentStock: 0,
    minimumStock: 0,
    isActive: true,
  });
}

class ArticleCreationHarness implements InventoryUnitOfWork {
  readonly savedArticles: Versioned<Article>[] = [];
  readonly savedMovements: Movement[] = [];
  lastArticleListCriteria: ArticleListCriteria | undefined;
  private readonly categories = new Map<string, Versioned<Category>>();
  private readonly articles = new Map<string, Versioned<Article>>();

  constructor(private readonly options: { failOnMovementAppend?: boolean } = {}) {}

  addCategory(category: Category): void {
    this.categories.set(category.id, { entity: category, version: 0 });
  }

  addArticle(article: Article): void {
    this.articles.set(article.id, { entity: article, version: 0 });
  }

  async execute<T>(operation: (repositories: InventoryRepositories) => Promise<T>): Promise<T> {
    const pendingArticles: Versioned<Article>[] = [];
    const pendingMovements: Movement[] = [];
    const repositories: InventoryRepositories = {
      categories: {
        findById: async (id: string) => this.categories.get(id) ?? null,
        findByNormalizedName: async (normalizedName: string) =>
          [...this.categories.values()].find(
            ({ entity }) => entity.normalizedName === normalizedName,
          ) ?? null,
        countArticleAssociations: async () => ({ active: 0, inactive: 0 }),
        save: async (category: Category, expectedVersion?: number) => {
          const saved = {
            entity: category,
            version: expectedVersion === undefined ? 0 : expectedVersion + 1,
          };
          this.categories.set(category.id, saved);
          return saved;
        },
        delete: async (id: string) => {
          this.categories.delete(id);
        },
        list: async (criteria) => {
          const items = [...this.categories.values()].filter(
            ({ entity }) =>
              criteria.isActive === undefined || entity.isActive === criteria.isActive,
          );

          return {
            items,
            page: criteria.page,
            pageSize: 25 as const,
            totalItems: items.length,
            totalPages: Math.ceil(items.length / 25),
          };
        },
      },
      articles: {
        findById: async (id: string) => this.articles.get(id) ?? null,
        findByNormalizedName: async (name: string) =>
          [...this.articles.values()].find(({ entity }) => entity.normalizedName === name) ?? null,
        save: async (article: Article, expectedVersion?: number) => {
          const saved = {
            entity: article,
            version: expectedVersion === undefined ? 0 : expectedVersion + 1,
          };
          pendingArticles.push(saved);
          return saved;
        },
        delete: async (id: string) => {
          this.articles.delete(id);
        },
        list: async (criteria) => {
          this.lastArticleListCriteria = criteria;

          return {
            items: [],
            page: criteria.page,
            pageSize: 25 as const,
            totalItems: 0,
            totalPages: 0,
          };
        },
        listLowStock: async (criteria) => ({
          items: [],
          page: criteria.page,
          pageSize: 25 as const,
          totalItems: 0,
          totalPages: 0,
        }),
      },
      movements: {
        nextSequence: async () => 1n,
        append: async (movement: Movement) => {
          if (this.options.failOnMovementAppend) {
            throw new Error('movement append failed');
          }

          pendingMovements.push(movement);
        },
        countByArticleId: async () => 0,
        list: async (criteria) => ({
          items: [],
          page: criteria.page,
          pageSize: 25 as const,
          totalItems: 0,
          totalPages: 0,
        }),
      },
    };

    const result = await operation(repositories);
    this.savedArticles.push(...pendingArticles);
    this.savedMovements.push(...pendingMovements);

    return result;
  }
}
