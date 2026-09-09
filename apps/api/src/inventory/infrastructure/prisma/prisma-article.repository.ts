import {
  ARTICLE_PAGE_SIZE,
  type ArticleType,
  type PaginatedResponse,
} from '@crm-photografy/shared';

import {
  type ArticleListCriteria,
  type ArticleRepository,
  type PageRequest,
  type Versioned,
} from '../../application/ports/inventory-ports';
import { Article } from '../../domain/articles/article';
import { type Prisma, type PrismaClient } from '../../../infrastructure/prisma/generated/client';

export class ArticleVersionConflictError extends Error {
  constructor() {
    super('article version does not match the persisted record');
    this.name = 'ArticleVersionConflictError';
  }
}

export class PrismaArticleRepository implements ArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Versioned<Article> | null> {
    const record = await this.prisma.article.findUnique({ where: { id } });

    return record ? toVersionedArticle(record) : null;
  }

  async findByNormalizedName(normalizedName: string): Promise<Versioned<Article> | null> {
    const record = await this.prisma.article.findUnique({ where: { normalizedName } });

    return record ? toVersionedArticle(record) : null;
  }

  async save(article: Article, expectedVersion?: number): Promise<Versioned<Article>> {
    if (expectedVersion === undefined) {
      const record = await this.prisma.article.create({
        data: {
          id: article.id,
          name: article.name,
          normalizedName: article.normalizedName,
          type: article.type,
          categoryId: article.categoryId,
          initialStock: article.initialStock,
          currentStock: article.currentStock,
          minimumStock: article.minimumStock,
          isActive: article.isActive,
        },
      });

      return toVersionedArticle(record);
    }

    const result = await this.prisma.article.updateMany({
      where: { id: article.id, version: expectedVersion },
      data: {
        name: article.name,
        normalizedName: article.normalizedName,
        type: article.type,
        categoryId: article.categoryId,
        initialStock: article.initialStock,
        currentStock: article.currentStock,
        minimumStock: article.minimumStock,
        isActive: article.isActive,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      throw new ArticleVersionConflictError();
    }

    return { entity: article, version: expectedVersion + 1 };
  }

  async delete(id: string, expectedVersion: number): Promise<void> {
    const result = await this.prisma.article.deleteMany({
      where: { id, version: expectedVersion },
    });

    if (result.count === 0) {
      throw new ArticleVersionConflictError();
    }
  }

  async list(criteria: ArticleListCriteria): Promise<PaginatedResponse<Versioned<Article>>> {
    return this.listMatching(criteria, {
      ...(criteria.normalizedName ? { normalizedName: { contains: criteria.normalizedName } } : {}),
      ...(criteria.type ? { type: criteria.type } : {}),
      ...(criteria.categoryId ? { categoryId: criteria.categoryId } : {}),
      ...(criteria.isActive === undefined ? {} : { isActive: criteria.isActive }),
    });
  }

  async listLowStock(criteria: PageRequest): Promise<PaginatedResponse<Versioned<Article>>> {
    return this.listMatching(criteria, {
      isActive: true,
      currentStock: { lte: this.prisma.article.fields.minimumStock },
    });
  }

  private async listMatching(
    criteria: PageRequest,
    where: Prisma.ArticleWhereInput,
  ): Promise<PaginatedResponse<Versioned<Article>>> {
    const page = Math.max(criteria.page, 1);
    const [records, totalItems] = await Promise.all([
      this.prisma.article.findMany({
        where,
        orderBy: { normalizedName: 'asc' },
        skip: (page - 1) * ARTICLE_PAGE_SIZE,
        take: ARTICLE_PAGE_SIZE,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: records.map(toVersionedArticle),
      page,
      pageSize: ARTICLE_PAGE_SIZE,
      totalItems,
      totalPages: Math.ceil(totalItems / ARTICLE_PAGE_SIZE),
    };
  }
}

function toVersionedArticle(record: {
  id: string;
  name: string;
  type: string;
  categoryId: string;
  initialStock: number;
  currentStock: number;
  minimumStock: number;
  isActive: boolean;
  version: number;
}): Versioned<Article> {
  return {
    entity: Article.rehydrate({
      id: record.id,
      name: record.name,
      type: record.type as ArticleType,
      categoryId: record.categoryId,
      initialStock: record.initialStock,
      currentStock: record.currentStock,
      minimumStock: record.minimumStock,
      isActive: record.isActive,
    }),
    version: record.version,
  };
}
