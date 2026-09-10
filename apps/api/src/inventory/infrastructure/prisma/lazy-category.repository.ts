import { PrismaPg } from '@prisma/adapter-pg';

import {
  type CategoryListCriteria,
  type CategoryRepository,
} from '../../application/ports/category-repository.port';
import { type Versioned } from '../../application/ports/repository-types.port';
import { Category } from '../../domain/categories/category';
import { type CategoryArticleCounts } from '../../domain/categories/category.properties';
import { PrismaClient } from '../../../infrastructure/prisma/generated/client';
import { PrismaCategoryRepository } from './prisma-category.repository';

export class LazyCategoryRepository implements CategoryRepository {
  private repositoryValue: PrismaCategoryRepository | undefined;

  async findById(id: string): Promise<Versioned<Category> | null> {
    return this.repository().findById(id);
  }

  async findByNormalizedName(normalizedName: string): Promise<Versioned<Category> | null> {
    return this.repository().findByNormalizedName(normalizedName);
  }

  async countArticleAssociations(categoryId: string): Promise<CategoryArticleCounts> {
    return this.repository().countArticleAssociations(categoryId);
  }

  async save(category: Category, expectedVersion?: number): Promise<Versioned<Category>> {
    return this.repository().save(category, expectedVersion);
  }

  async delete(id: string, expectedVersion: number): Promise<void> {
    return this.repository().delete(id, expectedVersion);
  }

  async list(criteria: CategoryListCriteria) {
    return this.repository().list(criteria);
  }

  private repository(): PrismaCategoryRepository {
    if (!this.repositoryValue) {
      const connectionString = process.env.DATABASE_URL;

      if (!connectionString) {
        throw new Error('DATABASE_URL is required to access inventory data');
      }

      const client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
      this.repositoryValue = new PrismaCategoryRepository(client);
    }

    return this.repositoryValue;
  }
}
