import { type PaginatedResponse } from '@crm-photografy/shared';
import { useEffect, useEffectEvent, useState } from 'react';
import { inventoryApi, type MovementRecord } from './api-client';

export interface MovementListClient {
  listMovements(page: number): Promise<PaginatedResponse<MovementRecord>>;
}

export function useMovementList(client: MovementListClient = inventoryApi) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResponse<MovementRecord> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const reload = useEffectEvent(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setResult(await client.listMovements(page));
    } catch {
      setError('No se pudieron cargar los movimientos. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  });
  useEffect(() => {
    void reload();
  }, [page]);
  return { error, isLoading, page, reload, result, setPage };
}
