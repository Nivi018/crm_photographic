import { describe, expect, it } from 'vitest';
import { InventoryApiClient } from './api-client';
import { createMockFetch } from '../test/mock-fetch';

describe('InventoryApiClient', () => {
  it('uses the typed inventory endpoints', async () => {
    const client = new InventoryApiClient(
      createMockFetch({ items: [], page: 1, pageSize: 25, totalItems: 0, totalPages: 0 }),
    );

    await expect(client.listArticles()).resolves.toMatchObject({ page: 1, pageSize: 25 });
    await expect(client.listCategories()).resolves.toMatchObject({ page: 1, pageSize: 25 });
    await expect(client.listMovements()).resolves.toMatchObject({ page: 1, pageSize: 25 });
  });
});
