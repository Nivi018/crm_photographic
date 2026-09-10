import {
  type ApiPaginatedResponse,
  type ApiResponse,
  type ArticleResponse,
  type CategoryResponse,
  type MovementOperationResponse,
  type MovementResponse,
  type PaginatedResponse,
} from '@crm-photografy/shared';

import { type Versioned } from '../application/ports/repository-types.port';
import { type Article } from '../domain/articles/article';
import { type Category } from '../domain/categories/category';
import { type Movement } from '../domain/stock/movement';

export function toArticleResponse(article: Versioned<Article>): ArticleResponse {
  return {
    id: article.entity.id,
    categoryId: article.entity.categoryId,
    name: article.entity.name,
    type: article.entity.type,
    initialStock: article.entity.initialStock,
    currentStock: article.entity.currentStock,
    minimumStock: article.entity.minimumStock,
    isActive: article.entity.isActive,
    hasLowStock: article.entity.hasLowStock,
    version: article.version,
  };
}

export function toCategoryResponse(category: Versioned<Category>): CategoryResponse {
  return {
    id: category.entity.id,
    name: category.entity.name,
    isActive: category.entity.isActive,
    version: category.version,
  };
}

export function toMovementResponse(movement: Movement): MovementResponse {
  return {
    id: movement.id,
    articleId: movement.articleId,
    sequence: movement.sequence.toString(),
    kind: movement.kind,
    source: movement.source,
    adjustmentMode: movement.adjustmentMode,
    appliedQuantity: movement.appliedQuantity,
    stockBefore: movement.stockBefore,
    stockAfter: movement.stockAfter,
    reason: movement.reason,
    occurredAt: movement.occurredAt.toISOString(),
  };
}

export function toResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

export function toPaginatedResponse<T, R>(
  page: PaginatedResponse<T>,
  map: (item: T) => R,
): ApiPaginatedResponse<R> {
  return {
    data: page.items.map(map),
    meta: {
      page: page.page,
      pageSize: page.pageSize,
      totalItems: page.totalItems,
      totalPages: page.totalPages,
    },
  };
}

export function toMovementOperationResponse(result: {
  article: Versioned<Article>;
  movement: Movement;
}): ApiResponse<MovementOperationResponse> {
  return toResponse({
    article: toArticleResponse(result.article),
    movement: toMovementResponse(result.movement),
  });
}
