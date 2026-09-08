import { MovementSource } from '@crm-photografy/shared';

import { Movement } from './movement';
import { calculateStockAfter, validateInitialStock } from './quantities';

export function replayCurrentStock(
  initialStock: number,
  movements: readonly (Movement | null)[],
): number {
  let currentStock = validateInitialStock(initialStock);

  for (const movement of movements) {
    if (!movement || movement.source === MovementSource.InitialStock) {
      continue;
    }

    currentStock = calculateStockAfter(currentStock, movement.appliedQuantity);
  }

  return currentStock;
}
