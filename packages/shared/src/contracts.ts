export enum ArticleType {
  Sale = 'SALE',
  InternalSupply = 'INTERNAL_SUPPLY',
}

export enum MovementKind {
  Entry = 'ENTRY',
  Exit = 'EXIT',
  Adjustment = 'ADJUSTMENT',
}

export enum AdjustmentMode {
  FinalStock = 'FINAL_STOCK',
  Delta = 'DELTA',
}

export enum MovementSource {
  InitialStock = 'INITIAL_STOCK',
  Manual = 'MANUAL',
}

export const ARTICLE_PAGE_SIZE = 25;

export const INVENTORY_LIMITS = {
  minimumStock: -999_999_999,
  maximumQuantity: 999_999_999,
  maximumArticleNameLength: 150,
  maximumCategoryNameLength: 150,
  maximumMovementReasonLength: 500,
} as const;

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: typeof ARTICLE_PAGE_SIZE;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ArticleResponse {
  id: string;
  categoryId: string;
  name: string;
  type: ArticleType;
  initialStock: number;
  currentStock: number;
  minimumStock: number;
  isActive: boolean;
  hasLowStock: boolean;
  version: number;
}

export interface CategoryResponse {
  id: string;
  name: string;
  isActive: boolean;
  version: number;
}

export interface MovementResponse {
  id: string;
  articleId: string;
  sequence: string;
  kind: MovementKind;
  source: MovementSource;
  adjustmentMode: AdjustmentMode | null;
  appliedQuantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  occurredAt: string;
}

export interface MovementOperationResponse {
  article: ArticleResponse;
  movement: MovementResponse;
}

export interface DeleteResponse {
  id: string;
}

export interface ValidationErrorDetails {
  fields: Array<{
    field: string;
    message: string;
  }>;
}

export interface NegativeStockConfirmationDetails {
  stockAfter: number;
}

export interface ApiErrorResponse {
  code: InventoryErrorCode;
  message: string;
  statusCode: number;
  details?: ValidationErrorDetails | NegativeStockConfirmationDetails;
}

export interface LivenessResponse {
  status: 'ok';
}

export interface ReadinessResponse {
  status: 'ready';
  database: 'available';
}

export enum InventoryErrorCode {
  Validation = 'VALIDATION_ERROR',
  NameConflict = 'NAME_CONFLICT',
  NotFound = 'NOT_FOUND',
  ArticleInactive = 'ARTICLE_INACTIVE',
  CategoryInactive = 'CATEGORY_INACTIVE',
  DependencyConflict = 'DEPENDENCY_CONFLICT',
  NegativeStockConfirmationRequired = 'NEGATIVE_STOCK_CONFIRMATION_REQUIRED',
  ReconfirmationRequired = 'RECONFIRMATION_REQUIRED',
  ConcurrentModification = 'CONCURRENT_MODIFICATION',
  StockOutOfRange = 'STOCK_OUT_OF_RANGE',
  NoStockDifference = 'NO_STOCK_DIFFERENCE',
  Internal = 'INTERNAL_ERROR',
  ServiceUnavailable = 'SERVICE_UNAVAILABLE',
}
