import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/app';
import { createInventoryDependencies } from './features/inventory/infrastructure/inventory-dependencies';
import './styles.css';

const rootElement = document.getElementById('root');
const { inventoryApi } = createInventoryDependencies();

if (!rootElement) {
  throw new Error('No se encontro el elemento raiz de la aplicacion.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App inventoryApi={inventoryApi} />
  </StrictMode>,
);
