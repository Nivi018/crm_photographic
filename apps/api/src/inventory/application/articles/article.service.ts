import { type ArticleType } from '@crm-photografy/shared';
import { randomUUID } from 'node:crypto';

import {
  type InventoryRepositories,
  type InventoryUnitOfWork,
  type Versioned,
} from '../ports/inventory-ports';
import { Article } from '../../domain/articles/article';
import { Movement } from '../../domain/stock/movement';

export interface CreateArticleCommand {
  name: string;
  type: ArticleType;
  categoryId: string;
  initialStock: number;
  minimumStock: number;
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

  private async assertNameIsAvailable(
    repositories: InventoryRepositories,
    article: Article,
  ): Promise<void> {
    const existing = await repositories.articles.findByNormalizedName(article.normalizedName);

    if (existing) {
      throw new ArticleNameConflictError();
    }
  }
}
