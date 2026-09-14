import type { InventoryApiPort } from '../application/ports/inventory-api.port';
import { InventoryApiClient } from './http/inventory-api-client';

export interface InventoryDependencies {
  inventoryApi: InventoryApiPort;
}

export function createInventoryDependencies({
  fetcher,
}: {
  fetcher?: typeof fetch;
} = {}): InventoryDependencies {
  return { inventoryApi: new InventoryApiClient(fetcher) };
}
