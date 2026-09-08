import { AdjustmentMode, MovementKind, MovementSource } from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';

import { Movement, NoStockDifferenceError } from './movement';
import { InvalidQuantityError, StockOutOfRangeError } from './quantities';
import { replayCurrentStock } from './stock-replay';

function identity(sequence = 1n) {
  return { id: `movement-${sequence}`, sequence, articleId: 'article-1' };
}

describe('stock adjustments', () => {
  it('records a final-stock adjustment with its calculated difference and automatic reason', () => {
    const movement = Movement.recordFinalStockAdjustment({
      ...identity(),
      stockBefore: 8,
      finalStock: 3,
    });

    expect(movement.kind).toBe(MovementKind.Adjustment);
    expect(movement.adjustmentMode).toBe(AdjustmentMode.FinalStock);
    expect(movement.appliedQuantity).toBe(-5);
    expect(movement.reason).toBe('Ajuste de inventario');
    expect(movement.stockBefore).toBe(8);
    expect(movement.stockAfter).toBe(3);
  });

  it('rejects a final-stock adjustment without a difference or with a negative target', () => {
    expect(() =>
      Movement.recordFinalStockAdjustment({ ...identity(), stockBefore: 3, finalStock: 3 }),
    ).toThrow(NoStockDifferenceError);
    expect(() =>
      Movement.recordFinalStockAdjustment({ ...identity(), stockBefore: 3, finalStock: -1 }),
    ).toThrow(InvalidQuantityError);
  });

  it('records a delta adjustment with its signed quantity and trimmed reason', () => {
    const movement = Movement.recordDeltaAdjustment({
      ...identity(),
      stockBefore: 3,
      quantity: -2,
      reason: '  Rotura  ',
    });

    expect(movement.kind).toBe(MovementKind.Adjustment);
    expect(movement.adjustmentMode).toBe(AdjustmentMode.Delta);
    expect(movement.appliedQuantity).toBe(-2);
    expect(movement.reason).toBe('Rotura');
    expect(movement.stockAfter).toBe(1);
  });

  it('rejects zero and overflowing delta adjustments', () => {
    expect(() =>
      Movement.recordDeltaAdjustment({
        ...identity(),
        stockBefore: 3,
        quantity: 0,
        reason: 'Rotura',
      }),
    ).toThrow(InvalidQuantityError);
    expect(() =>
      Movement.recordDeltaAdjustment({
        ...identity(),
        stockBefore: 999_999_999,
        quantity: 1,
        reason: 'Rotura',
      }),
    ).toThrow(StockOutOfRangeError);
  });

  it('creates the automatic visible initial-stock entry only for a positive stock', () => {
    const movement = Movement.recordInitialStock({ ...identity(), initialStock: 4 });

    expect(movement).not.toBeNull();
    expect(movement).toMatchObject({
      kind: MovementKind.Entry,
      adjustmentMode: null,
      source: MovementSource.InitialStock,
      appliedQuantity: 4,
      reason: 'Stock inicial',
      stockBefore: 0,
      stockAfter: 4,
    });
    expect(Movement.recordInitialStock({ ...identity(), initialStock: 0 })).toBeNull();
  });
});

describe('initial stock replay', () => {
  it('uses the new initial stock as base and reapplies later original differences', () => {
    const initialMovement = Movement.recordInitialStock({ ...identity(1n), initialStock: 5 });
    const entry = Movement.recordEntry({
      ...identity(2n),
      stockBefore: 5,
      quantity: 3,
      reason: 'Compra',
    });
    const finalStockAdjustment = Movement.recordFinalStockAdjustment({
      ...identity(3n),
      stockBefore: 8,
      finalStock: 4,
    });
    const exit = Movement.recordExit({
      ...identity(4n),
      stockBefore: 4,
      quantity: 1,
      reason: 'Uso',
    });

    const result = replayCurrentStock(20, [initialMovement, entry, finalStockAdjustment, exit]);

    expect(result).toBe(18);
    expect(initialMovement).toMatchObject({ appliedQuantity: 5, stockBefore: 0, stockAfter: 5 });
  });

  it('uses the edited initial stock as a virtual base when no initial movement exists', () => {
    const entry = Movement.recordEntry({
      ...identity(),
      stockBefore: 0,
      quantity: 3,
      reason: 'Compra',
    });

    expect(replayCurrentStock(7, [entry])).toBe(10);
  });

  it('rejects a replay that produces stock outside the allowed range', () => {
    const entry = Movement.recordEntry({
      ...identity(),
      stockBefore: 0,
      quantity: 1,
      reason: 'Compra',
    });

    expect(() => replayCurrentStock(999_999_999, [entry])).toThrow(StockOutOfRangeError);
  });
});
