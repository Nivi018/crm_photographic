import type {
  ApiPaginatedResponse,
  ApiResponse,
  ArticleResponse,
  CategoryResponse,
  DeleteResponse,
  MovementOperationResponse,
  MovementResponse,
} from '@crm-photografy/shared';
import type {
  ArticleMutationInput,
  UpdateArticleMutationInput,
  UpdateCategoryMutationInput,
} from '../../domain/inventory.types';

export interface InventoryArticleListQuery {
  categoryId?: string;
  isActive?: boolean;
  name?: string;
  page?: number;
  type?: ArticleResponse['type'];
}

export interface InventoryCategoryListQuery {
  isActive?: boolean;
  page?: number;
}

export interface InventoryMovementInput {
  confirmNegativeStock?: boolean;
  expectedVersion: number;
  quantity: number;
  reason: string;
}

export interface InventoryFinalStockAdjustmentInput {
  expectedVersion: number;
  finalStock: number;
}

export interface InventoryApiPort {
  createArticle(input: ArticleMutationInput): Promise<ApiResponse<ArticleResponse>>;
  createCategory(name: string): Promise<ApiResponse<CategoryResponse>>;
  createDeltaAdjustment(
    id: string,
    input: InventoryMovementInput,
  ): Promise<ApiResponse<MovementOperationResponse>>;
  createEntry(
    id: string,
    input: InventoryMovementInput,
  ): Promise<ApiResponse<MovementOperationResponse>>;
  createExit(
    id: string,
    input: InventoryMovementInput,
  ): Promise<ApiResponse<MovementOperationResponse>>;
  createFinalStockAdjustment(
    id: string,
    input: InventoryFinalStockAdjustmentInput,
  ): Promise<ApiResponse<MovementOperationResponse>>;
  deactivateArticle(id: string, expectedVersion: number): Promise<ApiResponse<ArticleResponse>>;
  deactivateCategory(id: string, expectedVersion: number): Promise<ApiResponse<CategoryResponse>>;
  deleteArticle(id: string, expectedVersion: number): Promise<ApiResponse<DeleteResponse>>;
  deleteCategory(id: string, expectedVersion: number): Promise<ApiResponse<DeleteResponse>>;
  findArticle(id: string): Promise<ApiResponse<ArticleResponse>>;
  listArticleMovements(id: string, page?: number): Promise<ApiPaginatedResponse<MovementResponse>>;
  listArticles(query?: InventoryArticleListQuery): Promise<ApiPaginatedResponse<ArticleResponse>>;
  listCategories(
    query?: InventoryCategoryListQuery,
  ): Promise<ApiPaginatedResponse<CategoryResponse>>;
  listLowStock(page?: number): Promise<ApiPaginatedResponse<ArticleResponse>>;
  listMovements(page?: number): Promise<ApiPaginatedResponse<MovementResponse>>;
  reactivateArticle(id: string, expectedVersion: number): Promise<ApiResponse<ArticleResponse>>;
  reactivateCategory(id: string, expectedVersion: number): Promise<ApiResponse<CategoryResponse>>;
  updateArticle(
    id: string,
    input: UpdateArticleMutationInput,
  ): Promise<ApiResponse<ArticleResponse>>;
  updateCategory(
    id: string,
    input: UpdateCategoryMutationInput,
  ): Promise<ApiResponse<CategoryResponse>>;
}
