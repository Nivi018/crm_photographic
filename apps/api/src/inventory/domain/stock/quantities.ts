import { INVENTORY_LIMITS } from '@crm-photografy/shared';

const { maximumQuantity, minimumStock } = INVENTORY_LIMITS;

export class InvalidQuantityError extends Error {
  constructor(field: string) {
    super(`${field} must be an integer within its allowed range`);
    this.name = 'InvalidQuantityError';
  }
}

export class StockOutOfRangeError extends Error {
  constructor() {
    super(`stock must be an integer between ${minimumStock} and ${maximumQuantity}`);
    this.name = 'StockOutOfRangeError';
  }
}

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

  if (!isIntegerWithinRange(appliedQuantity, -maximumQuantity, maximumQuantity)) {
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
