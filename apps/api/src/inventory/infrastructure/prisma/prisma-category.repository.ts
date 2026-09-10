import { ARTICLE_PAGE_SIZE, type PaginatedResponse } from '@crm-photografy/shared';

import {
  type CategoryListCriteria,
  type CategoryRepository,
} from '../../application/ports/category-repository.port';
import { type Versioned } from '../../application/ports/repository-types.port';
import { Category } from '../../domain/categories/category';
import { VersionConflictError } from '../../domain/inventory-error';
import { type CategoryArticleCounts } from '../../domain/categories/category.properties';
import { type PrismaClient } from '../../../infrastructure/prisma/generated/client';

export class CategoryVersionConflictError extends VersionConflictError {
  constructor() {
    super('category version does not match the persisted record');
  }
}

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Versioned<Category> | null> {
    const record = await this.prisma.category.findUnique({ where: { id } });

    return record ? toVersionedCategory(record) : null;
  }

  async findByNormalizedName(normalizedName: string): Promise<Versioned<Category> | null> {
    const record = await this.prisma.category.findUnique({ where: { normalizedName } });

    return record ? toVersionedCategory(record) : null;
  }

  async countArticleAssociations(categoryId: string): Promise<CategoryArticleCounts> {
    const [active, inactive] = await Promise.all([
      this.prisma.article.count({ where: { categoryId, isActive: true } }),
      this.prisma.article.count({ where: { categoryId, isActive: false } }),
    ]);

    return { active, inactive };
  }

  async save(category: Category, expectedVersion?: number): Promise<Versioned<Category>> {
    if (expectedVersion === undefined) {
      const record = await this.prisma.category.create({
        data: {
          id: category.id,
          name: category.name,
          normalizedName: category.normalizedName,
          isActive: category.isActive,
        },
      });

      return toVersionedCategory(record);
    }

    const result = await this.prisma.category.updateMany({
      where: { id: category.id, version: expectedVersion },
      data: {
        name: category.name,
        normalizedName: category.normalizedName,
        isActive: category.isActive,
        version: { increment: 1 },
      },
    });

    if (result.count === 0) {
      throw new CategoryVersionConflictError();
    }

    return { entity: category, version: expectedVersion + 1 };
  }

  async delete(id: string, expectedVersion: number): Promise<void> {
    const result = await this.prisma.category.deleteMany({
      where: { id, version: expectedVersion },
    });

    if (result.count === 0) {
      throw new CategoryVersionConflictError();
    }
  }

  async list(criteria: CategoryListCriteria): Promise<PaginatedResponse<Versioned<Category>>> {
    const page = Math.max(criteria.page, 1);
    const where = {
      ...(criteria.normalizedName ? { normalizedName: { contains: criteria.normalizedName } } : {}),
      ...(criteria.isActive === undefined ? {} : { isActive: criteria.isActive }),
    };
    const [records, totalItems] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy: { normalizedName: 'asc' },
        skip: (page - 1) * ARTICLE_PAGE_SIZE,
        take: ARTICLE_PAGE_SIZE,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      items: records.map(toVersionedCategory),
      page,
      pageSize: ARTICLE_PAGE_SIZE,
      totalItems,
      totalPages: Math.ceil(totalItems / ARTICLE_PAGE_SIZE),
    };
  }
}

function toVersionedCategory(record: {
  id: string;
  name: string;
  isActive: boolean;
  version: number;
}): Versioned<Category> {
  return {
    entity: Category.rehydrate({ id: record.id, name: record.name, isActive: record.isActive }),
    version: record.version,
  };
}
