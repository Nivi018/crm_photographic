import { type PaginatedResponse } from '@crm-photografy/shared';

import { type Category } from '../../domain/categories/category';
import { type CategoryListCriteria } from '../ports/category-repository.port';
import { type Versioned } from '../ports/repository-types.port';

export interface CreateCategoryCommand {
  name: string;
}

export type CategoryListQuery = CategoryListCriteria;

export interface RenameCategoryCommand {
  id: string;
  name: string;
  expectedVersion: number;
}

export interface CategoryStateCommand {
  id: string;
  expectedVersion: number;
}

export type CategoryResult = Versioned<Category>;
export type CategoryPage = PaginatedResponse<CategoryResult>;
