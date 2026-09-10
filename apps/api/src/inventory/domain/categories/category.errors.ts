import { INVENTORY_LIMITS, InventoryErrorCode } from '@crm-photografy/shared';
import { InventoryError } from '../inventory-error';

export class CategoryNameTooLongError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.Validation,
      `category name cannot exceed ${INVENTORY_LIMITS.maximumCategoryNameLength} characters`,
    );
  }
}

export class ActiveArticleAssociationError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.DependencyConflict,
      'category with active articles cannot be deactivated',
    );
  }
}

export class CategoryAssociationError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.DependencyConflict,
      'category with associated articles cannot be deleted',
    );
  }
}

export class InvalidArticleAssociationCountError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.Validation,
      'article association counts must be non-negative integers',
    );
  }
}
