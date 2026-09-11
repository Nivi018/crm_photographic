import { useState } from 'react';
import { InventoryApiError } from './api-client';
import type { ReconciliationDecision } from './use-mutation-reconciliation';
import { useMutationReconciliation } from './use-mutation-reconciliation';

export function useMovementOperation() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reconciliation = useMutationReconciliation();
  async function execute(
    operation: () => Promise<unknown>,
    reconcile: () => Promise<ReconciliationDecision>,
  ) {
    if (reconciliation.isMutationBlocked) return null;
    setError(null);
    setIsSubmitting(true);
    try {
      return await reconciliation.execute(operation, reconcile);
    } catch (cause) {
      setError(
        cause instanceof InventoryApiError ? cause.message : 'No se pudo registrar el movimiento.',
      );
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }
  return { ...reconciliation, error, execute, isSubmitting };
}
