import { InventoryErrorCode } from '@crm-photografy/shared';

export abstract class InventoryError extends Error {
  protected constructor(
    readonly code: InventoryErrorCode,
    message: string,
    readonly details?: { stockAfter: number },
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export function isInventoryError(error: unknown): error is InventoryError {
  return error instanceof InventoryError;
}

export class VersionConflictError extends InventoryError {
  constructor(message: string) {
    super(InventoryErrorCode.ConcurrentModification, message);
  }
}
