import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InventoryApiProvider, useInventoryApi } from './inventory-api-context';
import type { InventoryApiPort } from './ports/inventory-api.port';

function InventoryApiProbe() {
  const inventoryApi = useInventoryApi();
  return <p>{inventoryApi === expectedPort ? 'injected' : 'unexpected'}</p>;
}

const expectedPort = {} as InventoryApiPort;

describe('InventoryApiProvider', () => {
  it('makes the composition-root dependency available to the application', () => {
    render(
      <InventoryApiProvider inventoryApi={expectedPort}>
        <InventoryApiProbe />
      </InventoryApiProvider>,
    );

    expect(screen.getByText('injected')).toBeInTheDocument();
  });
});
