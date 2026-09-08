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
}
