import {
  AdjustmentMode,
  INVENTORY_LIMITS,
  MovementKind,
  MovementSource,
} from '@crm-photografy/shared';

import { trimRequiredText } from '../text/normalization';
import {
  calculateStockAfter,
  validateAdjustmentDelta,
  validateEntryQuantity,
  validateExitQuantity,
  validateFinalStock,
  validateInitialStock,
} from './quantities';

export interface MovementIdentity {
  id: string;
  sequence: bigint;
  articleId: string;
}

export interface ManualMovementProperties extends MovementIdentity {
  stockBefore: number;
  quantity: number;
  reason: string;
}

export interface FinalStockAdjustmentProperties extends MovementIdentity {
  stockBefore: number;
  finalStock: number;
}

export interface InitialStockMovementProperties extends MovementIdentity {
  initialStock: number;
}

export interface PersistedMovementProperties extends MovementIdentity {
  kind: MovementKind;
  adjustmentMode: AdjustmentMode | null;
  source: MovementSource;
  appliedQuantity: number;
  reason: string;
  occurredAt: Date;
  stockBefore: number;
}

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

export class Movement {
  readonly id: string;
  readonly sequence: bigint;
  readonly articleId: string;
  readonly kind: MovementKind;
  readonly adjustmentMode: AdjustmentMode | null;
  readonly source: MovementSource;
  readonly appliedQuantity: number;
  readonly reason: string;
  readonly stockBefore: number;
  readonly stockAfter: number;
  private readonly occurredAtValue: Date;

  private constructor(
    properties: MovementIdentity & { stockBefore: number },
    kind: MovementKind,
    adjustmentMode: AdjustmentMode | null,
    source: MovementSource,
    appliedQuantity: number,
    reason: string,
    occurredAt = new Date(),
  ) {
    this.id = properties.id;
    this.sequence = properties.sequence;
    this.articleId = properties.articleId;
    this.kind = kind;
    this.adjustmentMode = adjustmentMode;
    this.source = source;
    this.appliedQuantity = appliedQuantity;
    this.reason = reason;
    this.stockBefore = properties.stockBefore;
    this.stockAfter = calculateStockAfter(properties.stockBefore, appliedQuantity);
    this.occurredAtValue = new Date(occurredAt);

    Object.freeze(this);
  }

  static recordEntry(properties: ManualMovementProperties): Movement {
    return new Movement(
      properties,
      MovementKind.Entry,
      null,
      MovementSource.Manual,
      validateEntryQuantity(properties.quantity),
      prepareReason(properties.reason),
    );
  }

  static recordExit(properties: ManualMovementProperties): Movement {
    return new Movement(
      properties,
      MovementKind.Exit,
      null,
      MovementSource.Manual,
      -validateExitQuantity(properties.quantity),
      prepareReason(properties.reason),
    );
  }

  static recordFinalStockAdjustment(properties: FinalStockAdjustmentProperties): Movement {
    const finalStock = validateFinalStock(properties.finalStock);
    const appliedQuantity = finalStock - properties.stockBefore;

    if (appliedQuantity === 0) {
      throw new NoStockDifferenceError();
    }

    return new Movement(
      properties,
      MovementKind.Adjustment,
      AdjustmentMode.FinalStock,
      MovementSource.Manual,
      appliedQuantity,
      'Ajuste de inventario',
    );
  }

  static recordDeltaAdjustment(properties: ManualMovementProperties): Movement {
    return new Movement(
      properties,
      MovementKind.Adjustment,
      AdjustmentMode.Delta,
      MovementSource.Manual,
      validateAdjustmentDelta(properties.quantity),
      prepareReason(properties.reason),
    );
  }

  static recordInitialStock(properties: InitialStockMovementProperties): Movement | null {
    const initialStock = validateInitialStock(properties.initialStock);

    if (initialStock === 0) {
      return null;
    }

    return new Movement(
      { ...properties, stockBefore: 0 },
      MovementKind.Entry,
      null,
      MovementSource.InitialStock,
      initialStock,
      'Stock inicial',
    );
  }

  static rehydrate(properties: PersistedMovementProperties): Movement {
    return new Movement(
      properties,
      properties.kind,
      properties.adjustmentMode,
      properties.source,
      properties.appliedQuantity,
      properties.reason,
      properties.occurredAt,
    );
  }

  get occurredAt(): Date {
    return new Date(this.occurredAtValue);
  }
}

function prepareReason(value: string): string {
  const reason = trimRequiredText(value, 'reason');

  if (reason.length > INVENTORY_LIMITS.maximumMovementReasonLength) {
    throw new MovementReasonTooLongError();
  }

  return reason;
}
