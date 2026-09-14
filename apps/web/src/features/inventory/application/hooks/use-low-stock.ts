import { useState } from 'react';
import { useOptionalInventoryApi } from '../inventory-api-context';
import { useInventoryQuery } from './use-inventory-query';
import type { InventoryApiPort } from '../ports/inventory-api.port';

export type LowStockClient = Pick<InventoryApiPort, 'listLowStock'>;

export function useLowStock(client?: LowStockClient) {
  const injectedInventoryApi = useOptionalInventoryApi();
  const inventoryApi = client ?? injectedInventoryApi;
  if (!inventoryApi)
    throw new Error('Las alertas de stock bajo requieren un puerto de inventario.');
  const [page, setPage] = useState(1);
  const query = useInventoryQuery({
    errorMessage: () => 'No se pudieron cargar las alertas de stock bajo.',
    query: () => inventoryApi.listLowStock(page),
    queryKey: String(page),
  });
  return { ...query, page, setPage, totalPages: Math.max(query.result?.meta.totalPages ?? 1, 1) };
}
