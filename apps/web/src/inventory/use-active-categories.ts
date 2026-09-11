import { type ApiPaginatedResponse } from '@crm-photografy/shared';
import { useEffect, useEffectEvent, useState } from 'react';
import { inventoryApi, type CategoryRecord } from './api-client';

export interface ActiveCategoryClient {
  listCategories(query: {
    isActive: true;
    page: number;
  }): Promise<ApiPaginatedResponse<CategoryRecord>>;
}

export function useActiveCategories(client: ActiveCategoryClient = inventoryApi) {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadCategories = useEffectEvent(async () => {
    try {
      setCategories((await client.listCategories({ isActive: true, page: 1 })).data);
    } catch {
      setError('No se pudieron cargar las categorias activas.');
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void loadCategories();
  }, []);

  return { categories, error, isLoading, reload: loadCategories };
}
