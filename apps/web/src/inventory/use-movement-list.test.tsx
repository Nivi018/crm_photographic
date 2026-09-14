import { type ApiPaginatedResponse, type MovementResponse } from '@crm-photografy/shared';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMovementList } from './use-movement-list';

const page: ApiPaginatedResponse<MovementResponse> = {
  data: [],
  meta: { page: 1, pageSize: 25, totalItems: 0, totalPages: 0 },
};

describe('useMovementList', () => {
  it('loads each requested page of the immutable movement history', async () => {
    const listMovements = vi.fn().mockResolvedValue(page);
    const { result } = renderHook(() => useMovementList({ listMovements }));

    await waitFor(() => expect(listMovements).toHaveBeenCalledWith(1));
    act(() => result.current.setPage(2));

    await waitFor(() => expect(listMovements).toHaveBeenLastCalledWith(2));
  });

  it('exposes a recoverable loading error', async () => {
    const { result } = renderHook(() =>
      useMovementList({ listMovements: vi.fn().mockRejectedValue(new Error('offline')) }),
    );

    await waitFor(() => expect(result.current.error).toContain('No se pudieron cargar'));
    expect(result.current.isLoading).toBe(false);
  });
});
