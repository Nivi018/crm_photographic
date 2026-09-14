import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UncertainMutationError } from './api-client';
import { useMovementOperation } from './use-movement-operation';

describe('useMovementOperation', () => {
  it('blocks a duplicate operation while reconciling an uncertain result', async () => {
    const { result } = renderHook(() => useMovementOperation());
    const uncertain = () => Promise.reject(new UncertainMutationError('Resultado incierto.'));
    const reconcile = () => new Promise<never>(() => undefined);

    act(() => {
      void result.current.execute(uncertain, reconcile);
    });

    await waitFor(() => expect(result.current.phase).toBe('verifying'));
    await expect(result.current.execute(uncertain, reconcile)).resolves.toBeNull();
  });
});
