import { type PaginatedResponse } from '@crm-photografy/shared';

import { type Category } from '../../domain/categories/category';
import { type CategoryArticleCounts } from '../../domain/categories/category.properties';
import { type PageRequest, type Versioned } from './repository-types.port';

export interface CategoryListCriteria extends PageRequest {
  normalizedName?: string;
  isActive?: boolean;
}

export interface CategoryRepository {
  findById(id: string): Promise<Versioned<Category> | null>;
  findByNormalizedName(normalizedName: string): Promise<Versioned<Category> | null>;
  countArticleAssociations(categoryId: string): Promise<CategoryArticleCounts>;
  save(category: Category, expectedVersion?: number): Promise<Versioned<Category>>;
  delete(id: string, expectedVersion: number): Promise<void>;
  list(criteria: CategoryListCriteria): Promise<PaginatedResponse<Versioned<Category>>>;
}
