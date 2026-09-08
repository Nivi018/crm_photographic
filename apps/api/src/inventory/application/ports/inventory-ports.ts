import { type ArticleType, type PaginatedResponse } from '@crm-photografy/shared';

import { type Article } from '../../domain/articles/article';
import { type Category, type CategoryArticleCounts } from '../../domain/categories/category';
import { type Movement } from '../../domain/stock/movement';

export interface Versioned<T> {
  entity: T;
  version: number;
}

export interface PageRequest {
  page: number;
}

export interface CategoryListCriteria extends PageRequest {
  normalizedName?: string;
  isActive?: boolean;
}

export interface ArticleListCriteria extends PageRequest {
  normalizedName?: string;
  type?: ArticleType;
  categoryId?: string;
  isActive?: boolean;
}

export interface MovementListCriteria extends PageRequest {
  articleId?: string;
}

export interface CategoryRepository {
  findById(id: string): Promise<Versioned<Category> | null>;
  findByNormalizedName(normalizedName: string): Promise<Versioned<Category> | null>;
  countArticleAssociations(categoryId: string): Promise<CategoryArticleCounts>;
  save(category: Category, expectedVersion?: number): Promise<Versioned<Category>>;
  delete(id: string, expectedVersion: number): Promise<void>;
  list(criteria: CategoryListCriteria): Promise<PaginatedResponse<Versioned<Category>>>;
}

export interface ArticleRepository {
  findById(id: string): Promise<Versioned<Article> | null>;
  findByNormalizedName(normalizedName: string): Promise<Versioned<Article> | null>;
  save(article: Article, expectedVersion?: number): Promise<Versioned<Article>>;
  delete(id: string, expectedVersion: number): Promise<void>;
  list(criteria: ArticleListCriteria): Promise<PaginatedResponse<Versioned<Article>>>;
  listLowStock(criteria: PageRequest): Promise<PaginatedResponse<Versioned<Article>>>;
}

export interface MovementRepository {
  nextSequence(): Promise<bigint>;
  append(movement: Movement): Promise<void>;
  countByArticleId(articleId: string): Promise<number>;
  list(criteria: MovementListCriteria): Promise<PaginatedResponse<Movement>>;
}

export interface InventoryRepositories {
  categories: CategoryRepository;
  articles: ArticleRepository;
  movements: MovementRepository;
}

export interface InventoryUnitOfWork {
  execute<T>(operation: (repositories: InventoryRepositories) => Promise<T>): Promise<T>;
}
