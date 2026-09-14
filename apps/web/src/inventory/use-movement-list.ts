import { useState } from 'react';
import { useOptionalInventoryApi } from '../features/inventory/application/inventory-api-context';
import { useInventoryQuery } from '../features/inventory/application/hooks/use-inventory-query';
import type { InventoryApiPort } from '../features/inventory/application/ports/inventory-api.port';

export type MovementListClient = Pick<InventoryApiPort, 'listMovements'>;

export function useMovementList(client?: MovementListClient) {
  const injectedInventoryApi = useOptionalInventoryApi();
  const inventoryApi = client ?? injectedInventoryApi;
  if (!inventoryApi) throw new Error('La lista de movimientos requiere un puerto de inventario.');
  const [page, setPage] = useState(1);
  const query = useInventoryQuery({
    errorMessage: () => 'No se pudieron cargar los movimientos. Intenta nuevamente.',
    query: () => inventoryApi.listMovements(page),
    queryKey: String(page),
  });
  return { ...query, page, setPage };
}
