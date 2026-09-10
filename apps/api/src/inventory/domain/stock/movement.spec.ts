import { INVENTORY_LIMITS, MovementKind, MovementSource } from '@crm-photografy/shared';
import { describe, expect, it, vi } from 'vitest';

import { Movement } from './movement';
import { MovementReasonTooLongError } from './movement.errors';
import { InvalidQuantityError, StockOutOfRangeError } from './quantity.errors';
import { RequiredTextError } from '../text/text.errors';

function movementInput() {
  return {
    id: 'movement-1',
    sequence: 1n,
    articleId: 'article-1',
    stockBefore: 3,
    quantity: 2,
    reason: '  Reposicion  ',
  };
}

describe('Movement', () => {
  it('records an entry with a positive applied quantity and calculated stock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T03:04:05.000Z'));

    const movement = Movement.recordEntry(movementInput());

    expect(movement.kind).toBe(MovementKind.Entry);
    expect(movement.adjustmentMode).toBeNull();
    expect(movement.source).toBe(MovementSource.Manual);
    expect(movement.appliedQuantity).toBe(2);
    expect(movement.reason).toBe('Reposicion');
    expect(movement.stockBefore).toBe(3);
    expect(movement.stockAfter).toBe(5);
    expect(movement.occurredAt.toISOString()).toBe('2026-01-02T03:04:05.000Z');

    vi.useRealTimers();
  });

  it('records an exit with a negative applied quantity and calculated stock', () => {
    const movement = Movement.recordExit({ ...movementInput(), quantity: 5 });

    expect(movement.kind).toBe(MovementKind.Exit);
    expect(movement.adjustmentMode).toBeNull();
    expect(movement.appliedQuantity).toBe(-5);
    expect(movement.stockBefore).toBe(3);
    expect(movement.stockAfter).toBe(-2);
  });

  it('rejects invalid entry and exit quantities', () => {
    for (const quantity of [0, -1, 1.5, INVENTORY_LIMITS.maximumQuantity + 1]) {
      expect(() => Movement.recordEntry({ ...movementInput(), quantity })).toThrow(
        InvalidQuantityError,
      );
      expect(() => Movement.recordExit({ ...movementInput(), quantity })).toThrow(
        InvalidQuantityError,
      );
    }
  });

  it('rejects blank and overlong movement reasons', () => {
    expect(() => Movement.recordEntry({ ...movementInput(), reason: ' \n ' })).toThrow(
      RequiredTextError,
    );
    expect(() =>
      Movement.recordEntry({
        ...movementInput(),
        reason: 'a'.repeat(INVENTORY_LIMITS.maximumMovementReasonLength + 1),
      }),
    ).toThrow(MovementReasonTooLongError);
  });

  it('rejects movements whose calculated stock exceeds the allowed range', () => {
    expect(() =>
      Movement.recordEntry({
        ...movementInput(),
        stockBefore: INVENTORY_LIMITS.maximumQuantity,
        quantity: 1,
      }),
    ).toThrow(StockOutOfRangeError);
    expect(() =>
      Movement.recordExit({
        ...movementInput(),
        stockBefore: INVENTORY_LIMITS.minimumStock,
        quantity: 1,
      }),
    ).toThrow(StockOutOfRangeError);
  });

  it('exposes immutable movement data', () => {
    const movement = Movement.recordEntry(movementInput());

    expect(Object.isFrozen(movement)).toBe(true);
    expect(movement.occurredAt).not.toBe(movement.occurredAt);
  });
});
