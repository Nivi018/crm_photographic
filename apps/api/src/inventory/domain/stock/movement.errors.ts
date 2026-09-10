import { INVENTORY_LIMITS } from '@crm-photografy/shared';

export class MovementReasonTooLongError extends Error {
  constructor() {
    super(
      `movement reason cannot exceed ${INVENTORY_LIMITS.maximumMovementReasonLength} characters`,
    );
    this.name = 'MovementReasonTooLongError';
  }
}

export class NoStockDifferenceError extends Error {
  constructor() {
    super('final stock adjustment must produce a difference');
    this.name = 'NoStockDifferenceError';
  }
}
