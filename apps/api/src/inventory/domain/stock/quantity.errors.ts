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
