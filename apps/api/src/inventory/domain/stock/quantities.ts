import { INVENTORY_LIMITS } from '@crm-photografy/shared';

import { InvalidQuantityError, StockOutOfRangeError } from './quantity.errors';

const { maximumQuantity, minimumStock } = INVENTORY_LIMITS;

export function validateInitialStock(value: number): number {
  return validateNonNegativeQuantity(value, 'initial stock');
}

export function validateMinimumStock(value: number): number {
  return validateNonNegativeQuantity(value, 'minimum stock');
}

export function validateFinalStock(value: number): number {
  return validateNonNegativeQuantity(value, 'final stock');
}

export function validateEntryQuantity(value: number): number {
  return validatePositiveQuantity(value, 'entry quantity');
}

export function validateExitQuantity(value: number): number {
  return validatePositiveQuantity(value, 'exit quantity');
}

export function validateAdjustmentDelta(value: number): number {
  if (!isIntegerWithinRange(value, -maximumQuantity, maximumQuantity) || value === 0) {
    throw new InvalidQuantityError('adjustment delta');
  }

  return value;
}

export function validateStock(value: number): number {
  if (!isIntegerWithinRange(value, minimumStock, maximumQuantity)) {
    throw new StockOutOfRangeError();
  }

  return value;
}

export function calculateStockAfter(currentStock: number, appliedQuantity: number): number {
  validateStock(currentStock);

  if (!Number.isInteger(appliedQuantity)) {
    throw new InvalidQuantityError('applied quantity');
  }

  return validateStock(currentStock + appliedQuantity);
}

function validateNonNegativeQuantity(value: number, field: string): number {
  if (!isIntegerWithinRange(value, 0, maximumQuantity)) {
    throw new InvalidQuantityError(field);
  }

  return value;
}

function validatePositiveQuantity(value: number, field: string): number {
  if (!isIntegerWithinRange(value, 1, maximumQuantity)) {
    throw new InvalidQuantityError(field);
  }

  return value;
}

function isIntegerWithinRange(value: number, minimum: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}
