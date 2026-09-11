import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UncertainMutationError } from './api-client';
import { useMutationReconciliation } from './use-mutation-reconciliation';

const uncertainResult = new UncertainMutationError('Resultado incierto.');

describe('useMutationReconciliation', () => {
  it('confirms an applied mutation without retrying it', async () => {
    const mutation = vi.fn().mockRejectedValue(uncertainResult);
    const reconcile = vi.fn().mockResolvedValue({ currentData: 'Stock 8.', outcome: 'applied' });
    const { result } = renderHook(() => useMutationReconciliation());

    await act(async () => result.current.execute(mutation, reconcile));

    expect(result.current.phase).toBe('applied');
    expect(result.current.currentData).toBe('Stock 8.');
    expect(mutation).toHaveBeenCalledTimes(1);
    await act(async () => result.current.retryMutation());
    expect(mutation).toHaveBeenCalledTimes(1);
  });

  it('enables only a manual retry when reconciliation confirms no change', async () => {
    const mutation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(uncertainResult)
      .mockResolvedValueOnce('saved');
    const reconcile = vi.fn().mockResolvedValue({ outcome: 'not-applied' });
    const { result } = renderHook(() => useMutationReconciliation());

    await act(async () => result.current.execute(mutation, reconcile));
    expect(result.current.phase).toBe('not-applied');
    expect(result.current.isMutationBlocked).toBe(true);

    await act(async () => result.current.retryMutation());
    expect(mutation).toHaveBeenCalledTimes(2);
    expect(result.current.phase).toBe('applied');
  });

  it('requires administrator confirmation before enabling a retry for an indeterminate result', async () => {
    const mutation = vi.fn().mockRejectedValue(uncertainResult);
    const reconcile = vi
      .fn()
      .mockResolvedValue({ currentData: 'Version 4.', outcome: 'indeterminate' });
    const { result } = renderHook(() => useMutationReconciliation());

    await act(async () => result.current.execute(mutation, reconcile));
    expect(result.current.phase).toBe('indeterminate');
    await act(async () => result.current.retryMutation());
    expect(mutation).toHaveBeenCalledTimes(1);

    act(() => result.current.confirmManualRetry());
    expect(result.current.phase).toBe('not-applied');
  });

  it('keeps the mutation blocked and retries only reconciliation when the query fails', async () => {
    const mutation = vi.fn().mockRejectedValue(uncertainResult);
    const reconcile = vi
      .fn<() => Promise<{ outcome: 'applied' }>>()
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce({ outcome: 'applied' });
    const { result } = renderHook(() => useMutationReconciliation());

    await act(async () => result.current.execute(mutation, reconcile));
    expect(result.current.phase).toBe('query-failed');
    await act(async () => result.current.execute(mutation, reconcile));
    expect(mutation).toHaveBeenCalledTimes(1);

    await act(async () => result.current.retryReconciliation());
    expect(reconcile).toHaveBeenCalledTimes(2);
    expect(result.current.phase).toBe('applied');
  });
});
