import { INVENTORY_LIMITS } from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';

import {
  calculateStockAfter,
  validateAdjustmentDelta,
  validateEntryQuantity,
  validateExitQuantity,
  validateFinalStock,
  validateInitialStock,
  validateMinimumStock,
  validateStock,
} from './quantities';
import { InvalidQuantityError, StockOutOfRangeError } from './quantity.errors';

const { maximumQuantity, minimumStock } = INVENTORY_LIMITS;

describe('inventory quantities', () => {
  it.each([
    ['initial stock', validateInitialStock],
    ['minimum stock', validateMinimumStock],
    ['final stock', validateFinalStock],
  ] as const)('accepts the inclusive non-negative range for %s', (_label, validate) => {
    expect(validate(0)).toBe(0);
    expect(validate(maximumQuantity)).toBe(maximumQuantity);
  });

  it.each([
    ['initial stock', validateInitialStock],
    ['minimum stock', validateMinimumStock],
    ['final stock', validateFinalStock],
  ] as const)('rejects invalid non-negative %s quantities', (_label, validate) => {
    for (const value of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, maximumQuantity + 1]) {
      expect(() => validate(value)).toThrow(InvalidQuantityError);
    }
  });

  it.each([
    ['entry', validateEntryQuantity],
    ['exit', validateExitQuantity],
  ] as const)('accepts positive quantities for %s', (_label, validate) => {
    expect(validate(1)).toBe(1);
    expect(validate(maximumQuantity)).toBe(maximumQuantity);
  });

  it.each([
    ['entry', validateEntryQuantity],
    ['exit', validateExitQuantity],
  ] as const)('rejects zero, negatives, non-integers, and overflow for %s', (_label, validate) => {
    for (const value of [0, -1, 1.5, maximumQuantity + 1]) {
      expect(() => validate(value)).toThrow(InvalidQuantityError);
    }
  });

  it('accepts a non-zero adjustment delta within the signed range', () => {
    expect(validateAdjustmentDelta(-maximumQuantity)).toBe(-maximumQuantity);
    expect(validateAdjustmentDelta(maximumQuantity)).toBe(maximumQuantity);
  });

  it('rejects a zero or out-of-range adjustment delta', () => {
    for (const value of [0, -maximumQuantity - 1, maximumQuantity + 1]) {
      expect(() => validateAdjustmentDelta(value)).toThrow(InvalidQuantityError);
    }
  });

  it('keeps stored stock within the inclusive signed range', () => {
    expect(validateStock(minimumStock)).toBe(minimumStock);
    expect(validateStock(maximumQuantity)).toBe(maximumQuantity);
    expect(() => validateStock(minimumStock - 1)).toThrow(StockOutOfRangeError);
    expect(() => validateStock(maximumQuantity + 1)).toThrow(StockOutOfRangeError);
  });

  it('rejects stock arithmetic that would overflow in either direction', () => {
    expect(calculateStockAfter(maximumQuantity - 1, 1)).toBe(maximumQuantity);
    expect(() => calculateStockAfter(maximumQuantity, 1)).toThrow(StockOutOfRangeError);
    expect(() => calculateStockAfter(minimumStock, -1)).toThrow(StockOutOfRangeError);
  });
});
