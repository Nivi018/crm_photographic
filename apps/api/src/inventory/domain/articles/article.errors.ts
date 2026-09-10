import { INVENTORY_LIMITS, InventoryErrorCode } from '@crm-photografy/shared';
import { InventoryError } from '../inventory-error';

export class ArticleNameTooLongError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.Validation,
      `article name cannot exceed ${INVENTORY_LIMITS.maximumArticleNameLength} characters`,
    );
  }
}

export class InvalidArticleTypeError extends InventoryError {
  constructor() {
    super(InventoryErrorCode.Validation, 'article type is invalid');
  }
}

export class CategoryInactiveError extends InventoryError {
  constructor() {
    super(InventoryErrorCode.CategoryInactive, 'article category must be active');
  }
}

export class ArticleInactiveError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.ArticleInactive,
      'inactive article cannot be modified or receive movements',
    );
  }
}

export class ArticleHasMovementsError extends InventoryError {
  constructor() {
    super(InventoryErrorCode.DependencyConflict, 'article with movements cannot be deleted');
  }
}

export class ArticleStockNotZeroError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.DependencyConflict,
      'article with non-zero current stock cannot be deleted',
    );
  }
}

export class InvalidMovementCountError extends InventoryError {
  constructor() {
    super(InventoryErrorCode.Validation, 'movement count must be a non-negative integer');
  }
}
