import { INVENTORY_LIMITS, InventoryErrorCode } from '@crm-photografy/shared';
import { InventoryError } from '../inventory-error';

const { maximumQuantity, minimumStock } = INVENTORY_LIMITS;

export class InvalidQuantityError extends InventoryError {
  constructor(field: string) {
    super(InventoryErrorCode.Validation, `${field} must be an integer within its allowed range`);
  }
}

export class StockOutOfRangeError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.StockOutOfRange,
      `stock must be an integer between ${minimumStock} and ${maximumQuantity}`,
    );
  }
}
