import { type ArticleType, type PaginatedResponse } from '@crm-photografy/shared';

import { type Article } from '../../domain/articles/article';
import { type ArticleListCriteria, type Versioned } from '../ports/inventory-ports';

export interface CreateArticleCommand {
  name: string;
  type: ArticleType;
  categoryId: string;
  initialStock: number;
  minimumStock: number;
}

export interface GetArticleQuery {
  id: string;
}

export interface ListArticlesQuery extends Omit<ArticleListCriteria, 'normalizedName'> {
  name?: string;
}

export interface ListLowStockArticlesQuery {
  page: number;
}

export interface EditArticleCommand extends CreateArticleCommand {
  id: string;
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

export type ArticleResult = Versioned<Article>;
export type ArticlePage = PaginatedResponse<ArticleResult>;
