import { useEffect, useEffectEvent, useState } from 'react';
import { useOptionalInventoryApi } from '../features/inventory/application/inventory-api-context';
import type { InventoryApiPort } from '../features/inventory/application/ports/inventory-api.port';

export type ActiveCategoryClient = Pick<InventoryApiPort, 'listCategories'>;

export function useActiveCategories(client?: ActiveCategoryClient) {
  const injectedInventoryApi = useOptionalInventoryApi();
  const inventoryApi = client ?? injectedInventoryApi;
  if (!inventoryApi) throw new Error('Las categorias activas requieren un puerto de inventario.');
  const [categories, setCategories] = useState<
    Awaited<ReturnType<InventoryApiPort['listCategories']>>['data']
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadCategories = useEffectEvent(async () => {
    try {
      setCategories((await inventoryApi.listCategories({ isActive: true, page: 1 })).data);
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
