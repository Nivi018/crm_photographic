import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useInventoryQuery } from './use-inventory-query';

function deferred<Value>() {
  let reject!: (error: unknown) => void;
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
}

describe('useInventoryQuery', () => {
  it('exposes loading and the result of the current query', async () => {
    const pending = deferred<string>();
    const query = vi.fn().mockReturnValue(pending.promise);
    const { result } = renderHook(() =>
      useInventoryQuery({ errorMessage: () => 'No se pudo cargar.', query, queryKey: 'page=1' }),
    );

    expect(result.current.isLoading).toBe(true);
    await act(async () => pending.resolve('Papel fotografico'));

    expect(result.current).toMatchObject({
      error: null,
      isLoading: false,
      result: 'Papel fotografico',
    });
  });

  it('retries the current query after an error', async () => {
    const query = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('Papel fotografico');
    const { result } = renderHook(() =>
      useInventoryQuery({
        errorMessage: () => 'No se pudieron cargar los articulos.',
        query,
        queryKey: 'name=papel&page=2',
      }),
    );

    await waitFor(() => expect(result.current.error).toBe('No se pudieron cargar los articulos.'));
    await act(async () => result.current.reload());

    expect(query).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({
      error: null,
      isLoading: false,
      result: 'Papel fotografico',
    });
  });

  it('ignores a late response for superseded criteria', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const query = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { rerender, result } = renderHook(
      ({ queryKey }) =>
        useInventoryQuery({ errorMessage: () => 'No se pudo cargar.', query, queryKey }),
      { initialProps: { queryKey: 'name=papel&page=1' } },
    );

    await waitFor(() => expect(query).toHaveBeenCalledTimes(1));
    rerender({ queryKey: 'name=marco&page=1' });
    await waitFor(() => expect(query).toHaveBeenCalledTimes(2));

    await act(async () => second.resolve('Marco'));
    await act(async () => first.resolve('Papel fotografico'));

    expect(result.current).toMatchObject({ error: null, isLoading: false, result: 'Marco' });
  });
});
