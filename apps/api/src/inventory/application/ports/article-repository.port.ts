import { type ArticleType, type PaginatedResponse } from '@crm-photografy/shared';

import { type Article } from '../../domain/articles/article';
import { type PageRequest, type Versioned } from './repository-types.port';

export interface ArticleListCriteria extends PageRequest {
  normalizedName?: string;
  type?: ArticleType;
  categoryId?: string;
  isActive?: boolean;
}

export interface ArticleRepository {
  findById(id: string): Promise<Versioned<Article> | null>;
  findByNormalizedName(normalizedName: string): Promise<Versioned<Article> | null>;
  save(article: Article, expectedVersion?: number): Promise<Versioned<Article>>;
  delete(id: string, expectedVersion: number): Promise<void>;
  list(criteria: ArticleListCriteria): Promise<PaginatedResponse<Versioned<Article>>>;
  listLowStock(criteria: PageRequest): Promise<PaginatedResponse<Versioned<Article>>>;
}
