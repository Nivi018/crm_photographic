import { describe, expect, it } from 'vitest';

import { assertDevelopmentEnvironment, runDevelopmentSeed } from '../../../../prisma/seed';

type Row = Record<string, unknown>;

function database(initial: { categories?: Row[]; articles?: Row[]; movements?: Row[] } = {}) {
  const categories = initial.categories ?? [];
  const articles = initial.articles ?? [];
  const movements = initial.movements ?? [];
  const api = {
    category: {
      findUnique: async ({ where }: { where: { id?: string; normalizedName?: string } }) =>
        categories.find(
          (row) => row.id === where.id || row.normalizedName === where.normalizedName,
        ) ?? null,
      create: async ({ data }: { data: Row }) => void categories.push({ ...data, version: 0 }),
    },
    article: {
      findUnique: async ({ where }: { where: { id?: string; normalizedName?: string } }) =>
        articles.find(
          (row) => row.id === where.id || row.normalizedName === where.normalizedName,
        ) ?? null,
      create: async ({ data }: { data: Row }) => void articles.push({ ...data, version: 0 }),
    },
    movement: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        movements.find((row) => row.id === where.id) ?? null,
      create: async ({ data }: { data: Row }) => void movements.push({ ...data, version: 0 }),
    },
    $disconnect: async () => undefined,
    $transaction: async <T>(operation: (transaction: unknown) => Promise<T>) => operation(api),
  };
  return api;
}

describe('development seed', () => {
  it('requires exactly the development environment', () => {
    expect(() => assertDevelopmentEnvironment({ NODE_ENV: 'Development' })).toThrow(
      'NODE_ENV=development',
    );
    expect(() => assertDevelopmentEnvironment({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('creates the representative catalog and reports all expected rows as existing on rerun', async () => {
    const client = database();
    const first = await runDevelopmentSeed(client as never);
    const second = await runDevelopmentSeed(client as never);

    expect(first.created).toEqual({ categories: 2, articles: 3, movements: 6 });
    expect(second.created).toEqual({ categories: 0, articles: 0, movements: 0 });
    expect(second.omitted).toEqual({ categories: 2, articles: 3, movements: 6 });
    expect(second.omissions.every((omission) => omission.code === 'ALREADY_EXISTS')).toBe(true);
  });

  it('preserves name collisions and skips dependent articles and movements', async () => {
    const client = database({
      categories: [
        { id: '99999999-0000-4000-8000-000000000001', normalizedName: 'catalogo ficticio activo' },
      ],
    });
    const summary = await runDevelopmentSeed(client as never);

    expect(summary.omissions).toContainEqual(expect.objectContaining({ code: 'NAME_CONFLICT' }));
    expect(
      summary.omissions.filter((omission) => omission.code === 'DEPENDENCY_SKIPPED'),
    ).toHaveLength(8);
  });

  it('preserves reserved IDs with incompatible content', async () => {
    const client = database({
      categories: [
        {
          id: '10000000-0000-4000-8000-000000000001',
          normalizedName: 'unrelated-category',
          version: 0,
        },
      ],
    });
    const summary = await runDevelopmentSeed(client as never);

    expect(summary.omissions).toContainEqual(
      expect.objectContaining({
        id: '10000000-0000-4000-8000-000000000001',
        code: 'RESERVED_ID_CONFLICT',
      }),
    );
  });

  it('does not append missing movements to an existing article', async () => {
    const client = database();
    await runDevelopmentSeed(client as never);
    client.movement.findUnique = async () => null;

    const summary = await runDevelopmentSeed(client as never);

    expect(summary.created.movements).toBe(0);
    expect(
      summary.omissions.filter((omission) => omission.code === 'EXISTING_RECORD_PRESERVED'),
    ).toHaveLength(6);
  });
});
