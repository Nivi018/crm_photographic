// Temporary bridge while inventory screens migrate to the injected application port.
export * from '../features/inventory/infrastructure/http/inventory-api-client';

import { InventoryApiClient } from '../features/inventory/infrastructure/http/inventory-api-client';

export const inventoryApi = new InventoryApiClient();
