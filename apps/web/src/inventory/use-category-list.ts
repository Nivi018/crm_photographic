import { type ApiPaginatedResponse } from '@crm-photografy/shared';
import { useEffect, useEffectEvent, useState } from 'react';
import { inventoryApi, type CategoryListQuery, type CategoryRecord } from './api-client';

export interface CategoryListClient {
  listCategories(query: CategoryListQuery): Promise<ApiPaginatedResponse<CategoryRecord>>;
}

export function useCategoryList(client: CategoryListClient = inventoryApi) {
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ApiPaginatedResponse<CategoryRecord> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const reload = useEffectEvent(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setResult(
        await client.listCategories({ page, ...(isActive === undefined ? {} : { isActive }) }),
      );
    } catch {
      setError('No se pudieron cargar las categorias. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  });
  useEffect(() => {
    void reload();
  }, [isActive, page]);
  function updateState(next: boolean | undefined) {
    setIsActive(next);
    setPage(1);
  }
  return { error, isActive, isLoading, page, reload, result, setPage, updateState };
}
