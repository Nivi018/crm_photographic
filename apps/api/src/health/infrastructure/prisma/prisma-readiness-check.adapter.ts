import { PrismaPg } from '@prisma/adapter-pg';
import type { OnApplicationShutdown } from '@nestjs/common';

import type { ReadinessCheckPort } from '../../application/readiness-check.port';
import { PrismaClient } from '../../../infrastructure/prisma/generated/client';

const READINESS_TIMEOUT_MS = 2_000;

const REQUIRED_COLUMNS = {
  Article: [
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
  ],
  Category: ['id', 'name', 'normalizedName', 'isActive', 'version', 'createdAt', 'updatedAt'],
  Movement: [
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
  ],
} as const;

const READINESS_QUERY = `
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name IN ('Category', 'Article', 'Movement')
`;

interface SchemaColumn {
  table_name: string;
  column_name: string;
}

interface PrismaReadinessClient {
  $disconnect(): Promise<void>;
  $queryRawUnsafe<T>(query: string): Promise<T>;
}

type PrismaClientFactory = (connectionString: string) => PrismaReadinessClient;

export class PrismaReadinessCheckAdapter implements ReadinessCheckPort, OnApplicationShutdown {
  private client: PrismaReadinessClient | undefined;

  constructor(
    private readonly environment: NodeJS.ProcessEnv = process.env,
    private readonly createClient: PrismaClientFactory = createPrismaClient,
    private readonly timeoutMs = READINESS_TIMEOUT_MS,
  ) {}

  async check(): Promise<void> {
    const connectionString = this.environment.DATABASE_URL;

    if (!connectionString) throw new Error('Database configuration is unavailable');

    const columns = await withinTimeout(
      this.getClient(connectionString).$queryRawUnsafe<SchemaColumn[]>(READINESS_QUERY),
      this.timeoutMs,
    );

    if (!hasRequiredSchema(columns)) throw new Error('Inventory schema is unavailable');
  }

  async close(): Promise<void> {
    const client = this.client;
    this.client = undefined;
    await client?.$disconnect();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.close();
  }

  private getClient(connectionString: string): PrismaReadinessClient {
    this.client ??= this.createClient(connectionString);
    return this.client;
  }
}

function createPrismaClient(connectionString: string): PrismaReadinessClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: READINESS_TIMEOUT_MS }),
  });
}

function hasRequiredSchema(columns: SchemaColumn[]): boolean {
  const foundColumns = new Map<string, Set<string>>();

  for (const column of columns) {
    const tableColumns = foundColumns.get(column.table_name) ?? new Set<string>();
    tableColumns.add(column.column_name);
    foundColumns.set(column.table_name, tableColumns);
  }

  return Object.entries(REQUIRED_COLUMNS).every(([table, requiredColumns]) =>
    requiredColumns.every((column) => foundColumns.get(table)?.has(column)),
  );
}

function withinTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Readiness check timed out')), timeoutMs);

    void operation.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}
