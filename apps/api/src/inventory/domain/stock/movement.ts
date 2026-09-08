import {
  AdjustmentMode,
  INVENTORY_LIMITS,
  MovementKind,
  MovementSource,
} from '@crm-photografy/shared';

import { trimRequiredText } from '../text/normalization';
import { calculateStockAfter, validateEntryQuantity, validateExitQuantity } from './quantities';

export interface ManualMovementProperties {
  id: string;
  sequence: bigint;
  articleId: string;
  stockBefore: number;
  quantity: number;
  reason: string;
}

export class MovementReasonTooLongError extends Error {
  constructor() {
    super(
      `movement reason cannot exceed ${INVENTORY_LIMITS.maximumMovementReasonLength} characters`,
    );
    this.name = 'MovementReasonTooLongError';
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
    properties: ManualMovementProperties,
    kind: MovementKind.Entry | MovementKind.Exit,
    appliedQuantity: number,
  ) {
    this.id = properties.id;
    this.sequence = properties.sequence;
    this.articleId = properties.articleId;
    this.kind = kind;
    this.adjustmentMode = null;
    this.source = MovementSource.Manual;
    this.appliedQuantity = appliedQuantity;
    this.reason = prepareReason(properties.reason);
    this.stockBefore = properties.stockBefore;
    this.stockAfter = calculateStockAfter(properties.stockBefore, appliedQuantity);
    this.occurredAtValue = new Date();

    Object.freeze(this);
  }

  static recordEntry(properties: ManualMovementProperties): Movement {
    return new Movement(properties, MovementKind.Entry, validateEntryQuantity(properties.quantity));
  }

  static recordExit(properties: ManualMovementProperties): Movement {
    return new Movement(properties, MovementKind.Exit, -validateExitQuantity(properties.quantity));
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
