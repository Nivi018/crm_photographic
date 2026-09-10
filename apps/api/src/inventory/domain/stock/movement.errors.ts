import { INVENTORY_LIMITS, InventoryErrorCode } from '@crm-photografy/shared';
import { InventoryError } from '../inventory-error';

export class MovementReasonTooLongError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.Validation,
      `movement reason cannot exceed ${INVENTORY_LIMITS.maximumMovementReasonLength} characters`,
    );
  }
}

export class NoStockDifferenceError extends InventoryError {
  constructor() {
    super(InventoryErrorCode.NoStockDifference, 'final stock adjustment must produce a difference');
  }
}
