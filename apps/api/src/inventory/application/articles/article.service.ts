import { type ArticleType, type PaginatedResponse } from '@crm-photografy/shared';
import { randomUUID } from 'node:crypto';

import {
  type InventoryRepositories,
  type InventoryUnitOfWork,
  type ArticleListCriteria,
  type Versioned,
} from '../ports/inventory-ports';
import { Article } from '../../domain/articles/article';
import { Movement } from '../../domain/stock/movement';
import { replayCurrentStock } from '../../domain/stock/stock-replay';
import { normalizeName } from '../../domain/text/normalization';

export interface CreateArticleCommand {
  name: string;
  type: ArticleType;
  categoryId: string;
  initialStock: number;
  minimumStock: number;
}

export interface ListArticlesQuery extends Omit<ArticleListCriteria, 'normalizedName'> {
  name?: string;
}

export interface EditArticleCommand {
  id: string;
  name: string;
  type: ArticleType;
  categoryId: string;
  initialStock: number;
  minimumStock: number;
  expectedVersion: number;
  confirmNegativeStock?: boolean;
}

export interface ArticleStateCommand {
  id: string;
  expectedVersion: number;
}

export interface ReactivateArticleCommand extends ArticleStateCommand {
  categoryId?: string;
}

export class NegativeStockConfirmationRequiredError extends Error {
  constructor(readonly stockAfter: number) {
    super('editing initial stock would produce negative stock');
    this.name = 'NegativeStockConfirmationRequiredError';
  }
}

export class ArticleNameConflictError extends Error {
  constructor() {
    super('an article with the same normalized name already exists');
    this.name = 'ArticleNameConflictError';
  }
}

export class ArticleCategoryNotFoundError extends Error {
  constructor() {
    super('article category was not found');
    this.name = 'ArticleCategoryNotFoundError';
  }
}

export class ArticleNotFoundError extends Error {
  constructor() {
    super('article was not found');
    this.name = 'ArticleNotFoundError';
  }
}

export class NoActiveCategoriesError extends Error {
  constructor() {
    super('at least one active category is required to create an article');
    this.name = 'NoActiveCategoriesError';
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

      const saved = await repositories.articles.save(article);
      const initialMovement = Movement.recordInitialStock({
        id: randomUUID(),
        sequence: await repositories.movements.nextSequence(),
        articleId: article.id,
        initialStock: article.initialStock,
      });

      if (initialMovement) {
        await repositories.movements.append(initialMovement);
      }

      return saved;
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

  async edit(command: EditArticleCommand): Promise<Versioned<Article>> {
    return this.unitOfWork.execute(async (repositories) => {
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
      const movements = await this.listArticleMovements(repositories, article.id);
      const currentStock = replayCurrentStock(article.initialStock, movements);

      if (currentStock < 0 && !command.confirmNegativeStock) {
        throw new NegativeStockConfirmationRequiredError(currentStock);
      }

      return repositories.articles.save(
        Article.rehydrate({ ...article, currentStock }),
        command.expectedVersion,
      );
    });
  }

  async deactivate(command: ArticleStateCommand): Promise<Versioned<Article>> {
    return this.unitOfWork.execute(async (repositories) => {
      const stored = await this.findArticle(repositories, command.id);
      const article = rehydrateArticle(stored.entity);
      article.deactivate();

      return repositories.articles.save(article, command.expectedVersion);
    });
  }

  async reactivate(command: ReactivateArticleCommand): Promise<Versioned<Article>> {
    return this.unitOfWork.execute(async (repositories) => {
      const stored = await this.findArticle(repositories, command.id);
      const article = rehydrateArticle(stored.entity);
      const category = await this.findCategory(
        repositories,
        command.categoryId ?? article.categoryId,
      );
      article.reactivate({ id: category.entity.id, isActive: category.entity.isActive });

      return repositories.articles.save(article, command.expectedVersion);
    });
  }

  async delete(command: ArticleStateCommand): Promise<void> {
    return this.unitOfWork.execute(async (repositories) => {
      const stored = await this.findArticle(repositories, command.id);
      const movementCount = await repositories.movements.countByArticleId(command.id);
      stored.entity.assertCanBeDeleted(movementCount);

      await repositories.articles.delete(command.id, command.expectedVersion);
    });
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

  private async listArticleMovements(
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
