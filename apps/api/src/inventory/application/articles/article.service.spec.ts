import { ArticleType, MovementSource } from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';

import { type ArticleListCriteria } from '../ports/article-repository.port';
import {
  type InventoryRepositories,
  type InventoryUnitOfWork,
} from '../ports/inventory-unit-of-work.port';
import { type Versioned } from '../ports/repository-types.port';
import { Article } from '../../domain/articles/article';
import { Category } from '../../domain/categories/category';
import { Movement } from '../../domain/stock/movement';
import {
  ArticleNameConflictError,
  ArticleService,
  ConcurrentModificationError,
  NegativeStockConfirmationRequiredError,
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

  it('lists the global history and history for inactive articles', async () => {
    const harness = new ArticleCreationHarness();
    const article = Article.rehydrate({
      ...activeArticle('article-history'),
      isActive: false,
    });
    harness.addArticle(article);
    const service = new ArticleService(harness);

    await service.listMovements({ page: 2 });
    expect(harness.lastMovementListCriteria).toEqual({ page: 2 });

    await service.listArticleMovements(article.id, { page: 3 });
    expect(harness.lastMovementListCriteria).toEqual({ articleId: article.id, page: 3 });
  });

  it('lists low-stock articles through the active-only repository query', async () => {
    const harness = new ArticleCreationHarness();
    const service = new ArticleService(harness);

    await service.listLowStock({ page: 2 });

    expect(harness.lastLowStockCriteria).toEqual({ page: 2 });
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

  it('records an entry and updates stock atomically', async () => {
    const harness = new ArticleCreationHarness();
    const article = activeArticle('article-entry');
    harness.addArticle(article);
    const service = new ArticleService(harness);

    const updated = await service.registerEntry({
      articleId: article.id,
      quantity: 4,
      reason: '  Reposicion  ',
      expectedVersion: 0,
    });

    expect(updated.entity.currentStock).toBe(4);
    expect(harness.savedMovements).toHaveLength(1);
    expect(harness.savedMovements[0]).toMatchObject({
      articleId: article.id,
      stockBefore: 0,
      stockAfter: 4,
      appliedQuantity: 4,
      reason: 'Reposicion',
    });
  });

  it('requires confirmation before a negative-stock exit and persists nothing', async () => {
    const harness = new ArticleCreationHarness();
    const article = articleWithStock('article-exit-warning', 2);
    harness.addArticle(article);
    const service = new ArticleService(harness);

    await expect(
      service.registerExit({
        articleId: article.id,
        quantity: 3,
        reason: 'Uso interno',
        expectedVersion: 0,
      }),
    ).rejects.toMatchObject({
      name: NegativeStockConfirmationRequiredError.name,
      stockAfter: -1,
    });
    expect(harness.savedMovements).toHaveLength(0);
  });

  it('records a confirmed exit that results in negative stock', async () => {
    const harness = new ArticleCreationHarness();
    const article = articleWithStock('article-exit-confirmed', 2);
    harness.addArticle(article);
    const service = new ArticleService(harness);

    const updated = await service.registerExit({
      articleId: article.id,
      quantity: 3,
      reason: 'Uso interno',
      expectedVersion: 0,
      confirmNegativeStock: true,
    });

    expect(updated.entity.currentStock).toBe(-1);
    expect(harness.savedMovements[0]).toMatchObject({ appliedQuantity: -3, stockAfter: -1 });
  });

  it('records a final-stock adjustment with the automatic reason and applied difference', async () => {
    const harness = new ArticleCreationHarness();
    const article = articleWithStock('article-final-adjustment', 5);
    harness.addArticle(article);
    const service = new ArticleService(harness);

    const updated = await service.registerFinalStockAdjustment({
      articleId: article.id,
      finalStock: 2,
      expectedVersion: 0,
    });

    expect(updated.entity.currentStock).toBe(2);
    expect(harness.savedMovements[0]).toMatchObject({
      appliedQuantity: -3,
      reason: 'Ajuste de inventario',
      stockBefore: 5,
      stockAfter: 2,
    });
  });

  it('requires confirmation before a negative delta adjustment', async () => {
    const harness = new ArticleCreationHarness();
    const article = articleWithStock('article-delta-adjustment', 1);
    harness.addArticle(article);
    const service = new ArticleService(harness);

    await expect(
      service.registerDeltaAdjustment({
        articleId: article.id,
        quantity: -2,
        reason: 'Correccion',
        expectedVersion: 0,
      }),
    ).rejects.toBeInstanceOf(NegativeStockConfirmationRequiredError);
    expect(harness.savedMovements).toHaveLength(0);
  });

  it('retries an entry once after an article version conflict', async () => {
    const harness = new ArticleCreationHarness({ articleSaveConflicts: 1 });
    const article = activeArticle('article-retry');
    harness.addArticle(article);
    const service = new ArticleService(harness);

    const updated = await service.registerEntry({
      articleId: article.id,
      quantity: 1,
      reason: 'Reposicion',
      expectedVersion: 0,
    });

    expect(updated.entity.currentStock).toBe(1);
    expect(harness.savedMovements).toHaveLength(1);
  });

  it('cancels an entry after a second article version conflict', async () => {
    const harness = new ArticleCreationHarness({ articleSaveConflicts: 2 });
    const article = activeArticle('article-second-conflict');
    harness.addArticle(article);
    const service = new ArticleService(harness);

    await expect(
      service.registerEntry({
        articleId: article.id,
        quantity: 1,
        reason: 'Reposicion',
        expectedVersion: 0,
      }),
    ).rejects.toBeInstanceOf(ConcurrentModificationError);
    expect(harness.savedMovements).toHaveLength(0);
  });

  it('requires reconfirmation when a retried exit becomes negative', async () => {
    const article = articleWithStock('article-reconfirmation', 1);
    const harness = new ArticleCreationHarness({
      articleSaveConflicts: 1,
      articleAfterConflict: articleWithStock(article.id, 0),
    });
    harness.addArticle(article);
    const service = new ArticleService(harness);

    await expect(
      service.registerExit({
        articleId: article.id,
        quantity: 1,
        reason: 'Uso interno',
        expectedVersion: 0,
      }),
    ).rejects.toMatchObject({
      name: NegativeStockConfirmationRequiredError.name,
      stockAfter: -1,
    });
    expect(harness.savedMovements).toHaveLength(0);
  });
});

function activeArticle(id: string): Article {
  return articleWithStock(id, 0);
}

function articleWithStock(id: string, currentStock: number): Article {
  return Article.rehydrate({
    id,
    name: 'Articulo activo',
    type: ArticleType.Sale,
    categoryId: 'category-1',
    initialStock: 0,
    currentStock,
    minimumStock: 0,
    isActive: true,
  });
}

class ArticleCreationHarness implements InventoryUnitOfWork {
  readonly savedArticles: Versioned<Article>[] = [];
  readonly savedMovements: Movement[] = [];
  lastArticleListCriteria: ArticleListCriteria | undefined;
  lastMovementListCriteria: { articleId?: string; page: number } | undefined;
  lastLowStockCriteria: { page: number } | undefined;
  private readonly categories = new Map<string, Versioned<Category>>();
  private readonly articles = new Map<string, Versioned<Article>>();

  private remainingArticleSaveConflicts: number;

  constructor(
    private readonly options: {
      failOnMovementAppend?: boolean;
      articleSaveConflicts?: number;
      articleAfterConflict?: Article;
    } = {},
  ) {
    this.remainingArticleSaveConflicts = options.articleSaveConflicts ?? 0;
  }

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
          if (this.remainingArticleSaveConflicts > 0) {
            this.remainingArticleSaveConflicts -= 1;
            if (this.options.articleAfterConflict) {
              this.articles.set(article.id, {
                entity: this.options.articleAfterConflict,
                version: expectedVersion === undefined ? 1 : expectedVersion + 1,
              });
            }
            const error = new Error('article version conflict');
            error.name = 'ArticleVersionConflictError';
            throw error;
          }

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
        listLowStock: async (criteria) => {
          this.lastLowStockCriteria = criteria;

          return {
            items: [],
            page: criteria.page,
            pageSize: 25 as const,
            totalItems: 0,
            totalPages: 0,
          };
        },
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
          ...(this.lastMovementListCriteria = criteria),
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
