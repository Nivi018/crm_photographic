import { InventoryErrorCode, type PaginatedResponse } from '@crm-photografy/shared';
import { randomUUID } from 'node:crypto';

import {
  type InventoryRepositories,
  type InventoryUnitOfWork,
} from '../ports/inventory-unit-of-work.port';
import { type Versioned } from '../ports/repository-types.port';
import { Article } from '../../domain/articles/article';
import { Movement } from '../../domain/stock/movement';
import { replayCurrentStock } from '../../domain/stock/stock-replay';
import { normalizeName } from '../../domain/text/normalization';
import { InventoryError, VersionConflictError } from '../../domain/inventory-error';
import {
  type ArticleStateCommand,
  type CreateArticleCommand,
  type EditArticleCommand,
  type ListArticlesQuery,
  type ListLowStockArticlesQuery,
  type ReactivateArticleCommand,
} from './article.contracts';
import {
  type ListMovementsQuery,
  type MovementPage,
  type MovementResult,
  type RegisterDeltaAdjustmentCommand,
  type RegisterEntryCommand,
  type RegisterExitCommand,
  type RegisterFinalStockAdjustmentCommand,
} from '../movements/movement.contracts';

export class NegativeStockConfirmationRequiredError extends InventoryError {
  constructor(readonly stockAfter: number) {
    super(
      InventoryErrorCode.NegativeStockConfirmationRequired,
      'editing initial stock would produce negative stock',
      { stockAfter },
    );
  }
}

export class ArticleNameConflictError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.NameConflict,
      'an article with the same normalized name already exists',
    );
  }
}

export class ArticleCategoryNotFoundError extends InventoryError {
  constructor() {
    super(InventoryErrorCode.NotFound, 'article category was not found');
  }
}

export class ArticleNotFoundError extends InventoryError {
  constructor() {
    super(InventoryErrorCode.NotFound, 'article was not found');
  }
}

export class NoActiveCategoriesError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.CategoryInactive,
      'at least one active category is required to create an article',
    );
  }
}

export class ConcurrentModificationError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.ConcurrentModification,
      'article changed again while retrying the operation',
    );
  }
}

export class ArticleService {
  constructor(private readonly unitOfWork: InventoryUnitOfWork) {}

  async create(command: CreateArticleCommand): Promise<Versioned<Article>> {
    return this.unitOfWork.execute(async (repositories) => {
      const category = await this.findCategory(repositories, command.categoryId);
      const article = Article.create({
        id: randomUUID(),
        name: command.name,
        type: command.type,
        category: { id: category.entity.id, isActive: category.entity.isActive },
        initialStock: command.initialStock,
        minimumStock: command.minimumStock,
      });
      await this.assertNameIsAvailable(repositories, article);

      const initialMovement = Movement.recordInitialStock({
        id: randomUUID(),
        sequence: await repositories.movements.nextSequence(),
        articleId: article.id,
        initialStock: article.initialStock,
      });

      const saved = await repositories.articles.save(article);

      if (!initialMovement) return saved;

      await repositories.movements.append(initialMovement);

      return repositories.articles.save(
        Article.rehydrate({ ...article, currentStock: initialMovement.stockAfter }),
        saved.version,
      );
    });
  }

  async findById(id: string): Promise<Versioned<Article> | null> {
    return this.unitOfWork.execute(({ articles }) => articles.findById(id));
  }

  async list(query: ListArticlesQuery): Promise<PaginatedResponse<Versioned<Article>>> {
    const name = query.name?.trim();

    return this.unitOfWork.execute(({ articles }) =>
      articles.list({
        page: query.page,
        ...(name ? { normalizedName: normalizeName(name) } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      }),
    );
  }

  async listLowStock(
    query: ListLowStockArticlesQuery,
  ): Promise<PaginatedResponse<Versioned<Article>>> {
    return this.unitOfWork.execute(({ articles }) => articles.listLowStock({ page: query.page }));
  }

  async listMovements(query: ListMovementsQuery): Promise<MovementPage> {
    return this.unitOfWork.execute(({ movements }) => movements.list({ page: query.page }));
  }

  async listArticleMovements(articleId: string, query: ListMovementsQuery): Promise<MovementPage> {
    return this.unitOfWork.execute(async (repositories) => {
      await this.findArticle(repositories, articleId);

      return repositories.movements.list({ articleId, page: query.page });
    });
  }

  async edit(command: EditArticleCommand): Promise<Versioned<Article>> {
    return this.withSingleRetry(command.id, command.expectedVersion, async (expectedVersion) =>
      this.unitOfWork.execute(async (repositories) => {
        const stored = await repositories.articles.findById(command.id);

        if (!stored) {
          throw new ArticleNotFoundError();
        }

        const category = await this.findCategory(repositories, command.categoryId);
        const article = Article.rehydrate({
          id: stored.entity.id,
          name: stored.entity.name,
          type: stored.entity.type,
          categoryId: stored.entity.categoryId,
          initialStock: stored.entity.initialStock,
          currentStock: stored.entity.currentStock,
          minimumStock: stored.entity.minimumStock,
          isActive: stored.entity.isActive,
        });
        article.edit({
          name: command.name,
          type: command.type,
          category: { id: category.entity.id, isActive: category.entity.isActive },
          initialStock: command.initialStock,
          minimumStock: command.minimumStock,
        });
        await this.assertNameIsAvailable(repositories, article, article.id);
        const movements = await this.listAllArticleMovements(repositories, article.id);
        const currentStock = replayCurrentStock(article.initialStock, movements);

        if (currentStock < 0 && !command.confirmNegativeStock) {
          throw new NegativeStockConfirmationRequiredError(currentStock);
        }

        return repositories.articles.save(
          Article.rehydrate({ ...article, currentStock }),
          expectedVersion,
        );
      }),
    );
  }

  async deactivate(command: ArticleStateCommand): Promise<Versioned<Article>> {
    return this.withSingleRetry(command.id, command.expectedVersion, async (expectedVersion) =>
      this.unitOfWork.execute(async (repositories) => {
        const stored = await this.findArticle(repositories, command.id);
        const article = rehydrateArticle(stored.entity);
        article.deactivate();

        return repositories.articles.save(article, expectedVersion);
      }),
    );
  }

  async reactivate(command: ReactivateArticleCommand): Promise<Versioned<Article>> {
    return this.withSingleRetry(command.id, command.expectedVersion, async (expectedVersion) =>
      this.unitOfWork.execute(async (repositories) => {
        const stored = await this.findArticle(repositories, command.id);
        const article = rehydrateArticle(stored.entity);
        const category = await this.findCategory(
          repositories,
          command.categoryId ?? article.categoryId,
        );
        article.reactivate({ id: category.entity.id, isActive: category.entity.isActive });

        return repositories.articles.save(article, expectedVersion);
      }),
    );
  }

  async delete(command: ArticleStateCommand): Promise<void> {
    return this.withSingleRetry(command.id, command.expectedVersion, async (expectedVersion) =>
      this.unitOfWork.execute(async (repositories) => {
        const stored = await this.findArticle(repositories, command.id);
        const movementCount = await repositories.movements.countByArticleId(command.id);
        stored.entity.assertCanBeDeleted(movementCount);

        await repositories.articles.delete(command.id, expectedVersion);
      }),
    );
  }

  async registerEntry(command: RegisterEntryCommand): Promise<MovementResult> {
    return this.withSingleRetry(
      command.articleId,
      command.expectedVersion,
      async (expectedVersion) =>
        this.unitOfWork.execute(async (repositories) => {
          const stored = await this.findArticle(repositories, command.articleId);
          const article = rehydrateArticle(stored.entity);
          article.assertCanReceiveMovement();
          const movement = Movement.recordEntry({
            id: randomUUID(),
            sequence: await repositories.movements.nextSequence(),
            articleId: article.id,
            stockBefore: article.currentStock,
            quantity: command.quantity,
            reason: command.reason,
          });
          const updatedArticle = Article.rehydrate({
            id: article.id,
            name: article.name,
            type: article.type,
            categoryId: article.categoryId,
            initialStock: article.initialStock,
            currentStock: movement.stockAfter,
            minimumStock: article.minimumStock,
            isActive: article.isActive,
          });

          await repositories.movements.append(movement);

          return {
            article: await repositories.articles.save(updatedArticle, expectedVersion),
            movement,
          };
        }),
    );
  }

  async registerExit(command: RegisterExitCommand): Promise<MovementResult> {
    return this.withSingleRetry(
      command.articleId,
      command.expectedVersion,
      async (expectedVersion) =>
        this.unitOfWork.execute(async (repositories) => {
          const stored = await this.findArticle(repositories, command.articleId);
          const article = rehydrateArticle(stored.entity);
          article.assertCanReceiveMovement();
          const movement = Movement.recordExit({
            id: randomUUID(),
            sequence: await repositories.movements.nextSequence(),
            articleId: article.id,
            stockBefore: article.currentStock,
            quantity: command.quantity,
            reason: command.reason,
          });

          if (movement.stockAfter < 0 && !command.confirmNegativeStock) {
            throw new NegativeStockConfirmationRequiredError(movement.stockAfter);
          }

          const updatedArticle = Article.rehydrate({
            id: article.id,
            name: article.name,
            type: article.type,
            categoryId: article.categoryId,
            initialStock: article.initialStock,
            currentStock: movement.stockAfter,
            minimumStock: article.minimumStock,
            isActive: article.isActive,
          });

          await repositories.movements.append(movement);

          return {
            article: await repositories.articles.save(updatedArticle, expectedVersion),
            movement,
          };
        }),
    );
  }

  async registerFinalStockAdjustment(
    command: RegisterFinalStockAdjustmentCommand,
  ): Promise<MovementResult> {
    return this.withSingleRetry(
      command.articleId,
      command.expectedVersion,
      async (expectedVersion) =>
        this.unitOfWork.execute(async (repositories) => {
          const stored = await this.findArticle(repositories, command.articleId);
          const article = rehydrateArticle(stored.entity);
          article.assertCanReceiveMovement();
          const movement = Movement.recordFinalStockAdjustment({
            id: randomUUID(),
            sequence: await repositories.movements.nextSequence(),
            articleId: article.id,
            stockBefore: article.currentStock,
            finalStock: command.finalStock,
          });

          return this.persistMovementAndStock(repositories, article, movement, expectedVersion);
        }),
    );
  }

  async registerDeltaAdjustment(command: RegisterDeltaAdjustmentCommand): Promise<MovementResult> {
    return this.withSingleRetry(
      command.articleId,
      command.expectedVersion,
      async (expectedVersion) =>
        this.unitOfWork.execute(async (repositories) => {
          const stored = await this.findArticle(repositories, command.articleId);
          const article = rehydrateArticle(stored.entity);
          article.assertCanReceiveMovement();
          const movement = Movement.recordDeltaAdjustment({
            id: randomUUID(),
            sequence: await repositories.movements.nextSequence(),
            articleId: article.id,
            stockBefore: article.currentStock,
            quantity: command.quantity,
            reason: command.reason,
          });

          if (movement.stockAfter < 0 && !command.confirmNegativeStock) {
            throw new NegativeStockConfirmationRequiredError(movement.stockAfter);
          }

          return this.persistMovementAndStock(repositories, article, movement, expectedVersion);
        }),
    );
  }

  private async findCategory(
    repositories: InventoryRepositories,
    categoryId: string,
  ): Promise<Versioned<{ id: string; isActive: boolean }>> {
    const category = await repositories.categories.findById(categoryId);

    if (category) {
      return category;
    }

    const activeCategories = await repositories.categories.list({ page: 1, isActive: true });

    if (activeCategories.totalItems === 0) {
      throw new NoActiveCategoriesError();
    }

    throw new ArticleCategoryNotFoundError();
  }

  private async withSingleRetry<T>(
    articleId: string,
    expectedVersion: number,
    operation: (version: number) => Promise<T>,
  ): Promise<T> {
    try {
      return await operation(expectedVersion);
    } catch (error) {
      if (!(error instanceof VersionConflictError)) {
        throw error;
      }

      const current = await this.findById(articleId);
      if (!current) {
        throw new ArticleNotFoundError();
      }

      try {
        return await operation(current.version);
      } catch (retryError) {
        if (retryError instanceof VersionConflictError) {
          throw new ConcurrentModificationError();
        }

        throw retryError;
      }
    }
  }

  private async findArticle(
    repositories: InventoryRepositories,
    id: string,
  ): Promise<Versioned<Article>> {
    const stored = await repositories.articles.findById(id);

    if (!stored) {
      throw new ArticleNotFoundError();
    }

    return stored;
  }

  private async persistMovementAndStock(
    repositories: InventoryRepositories,
    article: Article,
    movement: Movement,
    expectedVersion: number,
  ): Promise<MovementResult> {
    const updatedArticle = Article.rehydrate({
      id: article.id,
      name: article.name,
      type: article.type,
      categoryId: article.categoryId,
      initialStock: article.initialStock,
      currentStock: movement.stockAfter,
      minimumStock: article.minimumStock,
      isActive: article.isActive,
    });

    await repositories.movements.append(movement);

    return { article: await repositories.articles.save(updatedArticle, expectedVersion), movement };
  }

  private async assertNameIsAvailable(
    repositories: InventoryRepositories,
    article: Article,
    articleId?: string,
  ): Promise<void> {
    const existing = await repositories.articles.findByNormalizedName(article.normalizedName);

    if (existing && existing.entity.id !== articleId) {
      throw new ArticleNameConflictError();
    }
  }

  private async listAllArticleMovements(
    repositories: InventoryRepositories,
    articleId: string,
  ): Promise<Movement[]> {
    const movements: Movement[] = [];
    let page = 1;

    let hasMore = true;

    while (hasMore) {
      const result = await repositories.movements.list({ articleId, page });
      movements.push(...result.items);
      hasMore = page < result.totalPages;
      page += 1;
    }

    return movements;
  }
}

function rehydrateArticle(article: Article): Article {
  return Article.rehydrate({
    id: article.id,
    name: article.name,
    type: article.type,
    categoryId: article.categoryId,
    initialStock: article.initialStock,
    currentStock: article.currentStock,
    minimumStock: article.minimumStock,
    isActive: article.isActive,
  });
}
