import { describe, expect, it, vi } from 'vitest';

import { PrismaReadinessCheckAdapter } from './prisma-readiness-check.adapter';

const completeSchema = [
  ...columns('Category', [
    'id',
    'name',
    'normalizedName',
    'isActive',
    'version',
    'createdAt',
    'updatedAt',
  ]),
  ...columns('Article', [
    'id',
    'name',
    'normalizedName',
    'type',
    'categoryId',
    'initialStock',
    'currentStock',
    'minimumStock',
    'isActive',
    'version',
    'createdAt',
    'updatedAt',
  ]),
  ...columns('Movement', [
    'id',
    'sequence',
    'articleId',
    'kind',
    'adjustmentMode',
    'source',
    'appliedQuantity',
    'reason',
    'occurredAt',
    'stockBefore',
    'stockAfter',
  ]),
];

describe('PrismaReadinessCheckAdapter', () => {
  it('does not create a client when DATABASE_URL is absent', async () => {
    const createClient = vi.fn();
    const adapter = new PrismaReadinessCheckAdapter({}, createClient);

    await expect(adapter.check()).rejects.toThrow('Database configuration is unavailable');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('accepts the current inventory schema using a read-only metadata query', async () => {
    const query = vi.fn().mockResolvedValue(completeSchema);
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const adapter = new PrismaReadinessCheckAdapter({ DATABASE_URL: 'postgresql://test' }, () => ({
      $disconnect: disconnect,
      $queryRawUnsafe: query,
    }));

    await expect(adapter.check()).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledWith(expect.stringContaining('information_schema.columns'));
    await adapter.close();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('rejects a missing required structure', async () => {
    const adapter = new PrismaReadinessCheckAdapter({ DATABASE_URL: 'postgresql://test' }, () => ({
      $disconnect: vi.fn().mockResolvedValue(undefined),
      $queryRawUnsafe: vi.fn().mockResolvedValue([]),
    }));

    await expect(adapter.check()).rejects.toThrow('Inventory schema is unavailable');
  });

  it('rejects a connection failure and permits a later successful check', async () => {
    const query = vi
      .fn()
      .mockRejectedValueOnce(new Error('connection refused'))
      .mockResolvedValueOnce(completeSchema);
    const adapter = new PrismaReadinessCheckAdapter({ DATABASE_URL: 'postgresql://test' }, () => ({
      $disconnect: vi.fn().mockResolvedValue(undefined),
      $queryRawUnsafe: query,
    }));

    await expect(adapter.check()).rejects.toThrow('connection refused');
    await expect(adapter.check()).resolves.toBeUndefined();
  });

  it('rejects a check that reaches the inclusive two-second timeout boundary', async () => {
    vi.useFakeTimers();
    const adapter = new PrismaReadinessCheckAdapter({ DATABASE_URL: 'postgresql://test' }, () => ({
      $disconnect: vi.fn().mockResolvedValue(undefined),
      $queryRawUnsafe: vi.fn().mockImplementation(() => new Promise(() => undefined)),
    }));

    const readiness = adapter.check();
    const timeoutExpectation = expect(readiness).rejects.toThrow('Readiness check timed out');
    await vi.advanceTimersByTimeAsync(2_000);
    await timeoutExpectation;
    vi.useRealTimers();
  });

  it('closes its client on application shutdown', async () => {
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const adapter = new PrismaReadinessCheckAdapter({ DATABASE_URL: 'postgresql://test' }, () => ({
      $disconnect: disconnect,
      $queryRawUnsafe: vi.fn().mockResolvedValue(completeSchema),
    }));

    await adapter.check();
    await adapter.onApplicationShutdown();

    expect(disconnect).toHaveBeenCalledOnce();
  });
});

function columns(table_name: string, columnNames: string[]) {
  return columnNames.map((column_name) => ({ column_name, table_name }));
}
