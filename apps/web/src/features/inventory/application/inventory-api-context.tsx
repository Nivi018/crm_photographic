import { createContext, useContext, type ReactNode } from 'react';
import type { InventoryApiPort } from './ports/inventory-api.port';

const InventoryApiContext = createContext<InventoryApiPort | null>(null);

export function InventoryApiProvider({
  children,
  inventoryApi,
}: {
  children: ReactNode;
  inventoryApi: InventoryApiPort;
}): ReactNode {
  return (
    <InventoryApiContext.Provider value={inventoryApi}>{children}</InventoryApiContext.Provider>
  );
}

export function useInventoryApi(): InventoryApiPort {
  const inventoryApi = useContext(InventoryApiContext);
  if (!inventoryApi)
    throw new Error('La aplicacion de inventario no tiene una dependencia configurada.');
  return inventoryApi;
}
