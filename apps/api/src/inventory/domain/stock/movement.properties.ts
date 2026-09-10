import {
  type AdjustmentMode,
  type MovementKind,
  type MovementSource,
} from '@crm-photografy/shared';

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
