import { useRef, useState } from 'react';
import { UncertainMutationError } from './api-client';

export type ReconciliationOutcome = 'applied' | 'not-applied' | 'indeterminate';

export interface ReconciliationDecision {
  currentData?: string;
  outcome: ReconciliationOutcome;
}

export type MutationReconciliationPhase =
  'idle' | 'verifying' | 'applied' | 'not-applied' | 'indeterminate' | 'query-failed';

interface PendingMutation {
  reconcile: () => Promise<ReconciliationDecision>;
  retry: () => Promise<unknown>;
}

export function useMutationReconciliation() {
  const [currentData, setCurrentData] = useState<string | undefined>(undefined);
  const [phase, setPhase] = useState<MutationReconciliationPhase>('idle');
  const pendingMutation = useRef<PendingMutation | null>(null);

  async function reconcile(): Promise<void> {
    const pending = pendingMutation.current;
    if (!pending) return;

    setPhase('verifying');
    try {
      const decision = await pending.reconcile();
      setCurrentData(decision.currentData);
      setPhase(decision.outcome);
    } catch {
      setCurrentData(undefined);
      setPhase('query-failed');
    }
  }

  async function execute<T>(
    mutation: () => Promise<T>,
    reconciliation: () => Promise<ReconciliationDecision>,
  ): Promise<T | null> {
    if (phase !== 'idle') return null;

    setCurrentData(undefined);
    try {
      const result = await mutation();
      pendingMutation.current = null;
      return result;
    } catch (error) {
      if (!(error instanceof UncertainMutationError)) throw error;

      pendingMutation.current = { reconcile: reconciliation, retry: mutation };
      await reconcile();
      return null;
    }
  }

  async function retryReconciliation(): Promise<void> {
    if (phase === 'query-failed') await reconcile();
  }

  function confirmManualRetry(): void {
    if (phase === 'indeterminate') setPhase('not-applied');
  }

  async function retryMutation(): Promise<unknown | null> {
    const pending = pendingMutation.current;
    if (phase !== 'not-applied' || !pending) return null;

    setCurrentData(undefined);
    try {
      const result = await pending.retry();
      setPhase('applied');
      return result;
    } catch (error) {
      if (!(error instanceof UncertainMutationError)) throw error;

      await reconcile();
      return null;
    }
  }

  return {
    confirmManualRetry,
    currentData,
    execute,
    isMutationBlocked: phase !== 'idle',
    phase,
    retryMutation,
    retryReconciliation,
  };
}
