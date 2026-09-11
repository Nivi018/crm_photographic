import { InventoryErrorCode } from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';
import { InventoryApiClient, InventoryApiError, UncertainMutationError } from './api-client';
import { createMockFetch } from '../test/mock-fetch';

describe('InventoryApiClient', () => {
  it('uses the typed inventory endpoints', async () => {
    const client = new InventoryApiClient(
      createMockFetch({
        data: [],
        meta: { page: 1, pageSize: 25, totalItems: 0, totalPages: 0 },
      }),
    );

    await expect(client.listArticles()).resolves.toMatchObject({
      meta: { page: 1, pageSize: 25 },
    });
    await expect(client.listCategories()).resolves.toMatchObject({
      meta: { page: 1, pageSize: 25 },
    });
    await expect(client.listMovements()).resolves.toMatchObject({
      meta: { page: 1, pageSize: 25 },
    });
  });

  it('returns the delete success envelope and extracts typed API errors', async () => {
    const client = new InventoryApiClient(createMockFetch({ data: { id: 'article-1' } }));

    await expect(client.deleteArticle('article-1', 2)).resolves.toEqual({
      data: { id: 'article-1' },
    });

    const failingClient = new InventoryApiClient(
      createMockFetch(
        {
          code: InventoryErrorCode.Validation,
          details: { fields: [{ field: 'name', message: 'Ya existe.' }] },
          message: 'El nombre ya existe.',
          statusCode: 400,
        },
        400,
      ),
    );

    await expect(failingClient.createCategory('Papel')).rejects.toMatchObject({
      code: InventoryErrorCode.Validation,
      details: { fields: [{ field: 'name', message: 'Ya existe.' }] },
      message: 'El nombre ya existe.',
      statusCode: 400,
    } satisfies Partial<InventoryApiError>);
  });

  it('treats an HTTP 500 mutation response as uncertain', async () => {
    const client = new InventoryApiClient(
      createMockFetch({ code: 'INTERNAL_ERROR', message: 'Error interno.', statusCode: 500 }, 500),
    );

    await expect(client.createCategory('Papel')).rejects.toBeInstanceOf(UncertainMutationError);
  });

  it.each([
    ['timeout', new DOMException('The operation timed out.', 'TimeoutError')],
    ['network disconnect', new TypeError('Failed to fetch')],
  ])('treats a %s after sending a mutation as uncertain', async (_scenario, error) => {
    const client = new InventoryApiClient((async () => Promise.reject(error)) as typeof fetch);

    await expect(client.createCategory('Papel')).rejects.toBeInstanceOf(UncertainMutationError);
  });
});
