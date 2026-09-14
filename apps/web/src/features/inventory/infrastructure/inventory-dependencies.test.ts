import { describe, expect, it } from 'vitest';
import type { InventoryApiPort } from '../application/ports/inventory-api.port';
import { createMockFetch } from '../../../test/mock-fetch';
import { createInventoryDependencies } from './inventory-dependencies';

describe('createInventoryDependencies', () => {
  it('constructs an InventoryApiPort backed by the existing HTTP client', async () => {
    const dependencies = createInventoryDependencies({
      fetcher: createMockFetch({
        data: [],
        meta: { page: 1, pageSize: 25, totalItems: 0, totalPages: 0 },
      }),
    });
    const port: InventoryApiPort = dependencies.inventoryApi;

    await expect(port.listArticles()).resolves.toMatchObject({
      meta: { page: 1, pageSize: 25 },
    });
  });
});
