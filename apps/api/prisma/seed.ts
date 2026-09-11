import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/infrastructure/prisma/generated/client';

type OmissionCode =
  | 'ALREADY_EXISTS'
  | 'NAME_CONFLICT'
  | 'RESERVED_ID_CONFLICT'
  | 'DEPENDENCY_SKIPPED'
  | 'EXISTING_RECORD_PRESERVED';
type SeedKind = 'categories' | 'articles' | 'movements';

interface SeedSummary {
  created: Record<SeedKind, number>;
  omitted: Record<SeedKind, number>;
  omissions: Array<{ kind: SeedKind; id: string; code: OmissionCode; message: string }>;
}

interface CategorySeed {
  id: string;
  name: string;
  normalizedName: string;
  isActive: boolean;
}

interface ArticleSeed {
  id: string;
  name: string;
  normalizedName: string;
  type: 'SALE' | 'INTERNAL_SUPPLY';
  categoryId: string;
  initialStock: number;
  currentStock: number;
  minimumStock: number;
  isActive: boolean;
}

interface MovementSeed {
  id: string;
  articleId: string;
  kind: 'ENTRY' | 'EXIT' | 'ADJUSTMENT';
  adjustmentMode: 'FINAL_STOCK' | 'DELTA' | null;
  source: 'INITIAL_STOCK' | 'MANUAL';
  appliedQuantity: number;
  reason: string;
  occurredAt: Date;
  stockBefore: number;
  stockAfter: number;
}

interface SeedDatabase {
  category: {
    findUnique(args: {
      where: { id?: string; normalizedName?: string };
    }): Promise<Record<string, unknown> | null>;
    create(args: { data: CategorySeed }): Promise<unknown>;
  };
  article: {
    findUnique(args: {
      where: { id?: string; normalizedName?: string };
    }): Promise<Record<string, unknown> | null>;
    create(args: { data: ArticleSeed }): Promise<unknown>;
  };
  movement: {
    findUnique(args: { where: { id: string } }): Promise<Record<string, unknown> | null>;
    create(args: { data: MovementSeed }): Promise<unknown>;
  };
}

interface SeedClient extends SeedDatabase {
  $disconnect(): Promise<void>;
  $transaction<T>(
    operation: (transaction: SeedDatabase) => Promise<T>,
    options: { isolationLevel: 'Serializable' },
  ): Promise<T>;
}

const categories: CategorySeed[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Catalogo ficticio activo',
    normalizedName: 'catalogo ficticio activo',
    isActive: true,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    name: 'Catalogo ficticio inactivo',
    normalizedName: 'catalogo ficticio inactivo',
    isActive: false,
  },
];
const activeCategory = categories[0]!;
const inactiveCategory = categories[1]!;

const articles: ArticleSeed[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    name: 'Articulo ficticio para venta',
    normalizedName: 'articulo ficticio para venta',
    type: 'SALE',
    categoryId: activeCategory.id,
    initialStock: 10,
    currentStock: 9,
    minimumStock: 3,
    isActive: true,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    name: 'Insumo ficticio bajo',
    normalizedName: 'insumo ficticio bajo',
    type: 'INTERNAL_SUPPLY',
    categoryId: activeCategory.id,
    initialStock: 2,
    currentStock: 7,
    minimumStock: 7,
    isActive: true,
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    name: 'Articulo ficticio inactivo',
    normalizedName: 'articulo ficticio inactivo',
    type: 'SALE',
    categoryId: inactiveCategory.id,
    initialStock: 0,
    currentStock: 0,
    minimumStock: 0,
    isActive: false,
  },
];
const saleArticle = articles[0]!;
const lowStockArticle = articles[1]!;

const movements: MovementSeed[] = [
  movement(
    '30000000-0000-4000-8000-000000000001',
    saleArticle.id,
    'ENTRY',
    null,
    'INITIAL_STOCK',
    10,
    'Stock inicial',
    '2024-01-01T08:00:00.000Z',
    0,
    10,
  ),
  movement(
    '30000000-0000-4000-8000-000000000002',
    saleArticle.id,
    'EXIT',
    null,
    'MANUAL',
    -2,
    'Salida ficticia',
    '2024-01-02T08:00:00.000Z',
    10,
    8,
  ),
  movement(
    '30000000-0000-4000-8000-000000000003',
    saleArticle.id,
    'ADJUSTMENT',
    'FINAL_STOCK',
    'MANUAL',
    4,
    'Ajuste de inventario',
    '2024-01-03T08:00:00.000Z',
    8,
    12,
  ),
  movement(
    '30000000-0000-4000-8000-000000000004',
    saleArticle.id,
    'ADJUSTMENT',
    'DELTA',
    'MANUAL',
    -3,
    'Ajuste ficticio por diferencia',
    '2024-01-04T08:00:00.000Z',
    12,
    9,
  ),
  movement(
    '30000000-0000-4000-8000-000000000005',
    lowStockArticle.id,
    'ENTRY',
    null,
    'INITIAL_STOCK',
    2,
    'Stock inicial',
    '2024-01-01T09:00:00.000Z',
    0,
    2,
  ),
  movement(
    '30000000-0000-4000-8000-000000000006',
    lowStockArticle.id,
    'ENTRY',
    null,
    'MANUAL',
    5,
    'Entrada ficticia',
    '2024-01-02T09:00:00.000Z',
    2,
    7,
  ),
];

export function assertDevelopmentEnvironment(environment: NodeJS.ProcessEnv = process.env): void {
  if (environment.NODE_ENV !== 'development') {
    throw new Error('The development seed requires NODE_ENV=development');
  }
}

export async function runDevelopmentSeed(client: SeedClient): Promise<SeedSummary> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await client.$transaction((transaction) => seed(transaction), {
        isolationLevel: 'Serializable',
      });
    } catch (error: unknown) {
      if (attempt === 2 || !isConcurrentSeedConflict(error)) throw error;
    }
  }

  throw new Error('Development seed could not complete');
}

async function seed(database: SeedDatabase): Promise<SeedSummary> {
  const summary = createSummary();
  const availableCategories = new Set<string>();
  const createdArticles = new Set<string>();
  const availableArticles = new Set<string>();

  for (const category of categories) {
    const record = await database.category.findUnique({ where: { id: category.id } });
    if (record) {
      if (matches(record, category, true)) {
        availableCategories.add(category.id);
        omit(
          summary,
          'categories',
          category.id,
          'ALREADY_EXISTS',
          'La categoria ficticia ya existe.',
        );
      } else {
        omit(
          summary,
          'categories',
          category.id,
          'RESERVED_ID_CONFLICT',
          'El UUID reservado de categoria pertenece a otro registro.',
        );
      }
      continue;
    }

    const nameCollision = await database.category.findUnique({
      where: { normalizedName: category.normalizedName },
    });
    if (nameCollision) {
      omit(
        summary,
        'categories',
        category.id,
        'NAME_CONFLICT',
        'El nombre normalizado de categoria ya existe.',
      );
      continue;
    }

    await database.category.create({ data: category });
    availableCategories.add(category.id);
    summary.created.categories += 1;
  }

  for (const article of articles) {
    if (!availableCategories.has(article.categoryId)) {
      omit(
        summary,
        'articles',
        article.id,
        'DEPENDENCY_SKIPPED',
        'La categoria ficticia requerida fue omitida.',
      );
      continue;
    }

    const record = await database.article.findUnique({ where: { id: article.id } });
    if (record) {
      if (matches(record, article, true)) {
        availableArticles.add(article.id);
        omit(summary, 'articles', article.id, 'ALREADY_EXISTS', 'El articulo ficticio ya existe.');
      } else {
        omit(
          summary,
          'articles',
          article.id,
          'RESERVED_ID_CONFLICT',
          'El UUID reservado de articulo pertenece a otro registro.',
        );
      }
      continue;
    }

    const nameCollision = await database.article.findUnique({
      where: { normalizedName: article.normalizedName },
    });
    if (nameCollision) {
      omit(
        summary,
        'articles',
        article.id,
        'NAME_CONFLICT',
        'El nombre normalizado de articulo ya existe.',
      );
      continue;
    }

    await database.article.create({ data: article });
    createdArticles.add(article.id);
    availableArticles.add(article.id);
    summary.created.articles += 1;
  }

  for (const movementSeed of movements) {
    if (!availableArticles.has(movementSeed.articleId)) {
      omit(
        summary,
        'movements',
        movementSeed.id,
        'DEPENDENCY_SKIPPED',
        'El articulo ficticio requerido fue omitido.',
      );
      continue;
    }

    const record = await database.movement.findUnique({ where: { id: movementSeed.id } });
    if (record) {
      if (matches(record, movementSeed)) {
        omit(
          summary,
          'movements',
          movementSeed.id,
          'ALREADY_EXISTS',
          'El movimiento ficticio ya existe.',
        );
      } else {
        omit(
          summary,
          'movements',
          movementSeed.id,
          'RESERVED_ID_CONFLICT',
          'El UUID reservado de movimiento pertenece a otro registro.',
        );
      }
      continue;
    }

    if (!createdArticles.has(movementSeed.articleId)) {
      omit(
        summary,
        'movements',
        movementSeed.id,
        'EXISTING_RECORD_PRESERVED',
        'No se agrega un movimiento a un articulo existente para no alterar su historial, stock o version.',
      );
      continue;
    }

    await database.movement.create({ data: movementSeed });
    summary.created.movements += 1;
  }

  return summary;
}

function movement(
  id: string,
  articleId: string,
  kind: MovementSeed['kind'],
  adjustmentMode: MovementSeed['adjustmentMode'],
  source: MovementSeed['source'],
  appliedQuantity: number,
  reason: string,
  occurredAt: string,
  stockBefore: number,
  stockAfter: number,
): MovementSeed {
  return {
    id,
    articleId,
    kind,
    adjustmentMode,
    source,
    appliedQuantity,
    reason,
    occurredAt: new Date(occurredAt),
    stockBefore,
    stockAfter,
  };
}

function createSummary(): SeedSummary {
  return {
    created: { categories: 0, articles: 0, movements: 0 },
    omitted: { categories: 0, articles: 0, movements: 0 },
    omissions: [],
  };
}

function omit(
  summary: SeedSummary,
  kind: SeedKind,
  id: string,
  code: OmissionCode,
  message: string,
): void {
  summary.omitted[kind] += 1;
  summary.omissions.push({ kind, id, code, message });
}

function matches(
  record: Record<string, unknown>,
  expected: object,
  requiresVersion = false,
): boolean {
  return (
    Object.entries(expected).every(([key, value]) => {
      const actual = record[key];
      return value instanceof Date
        ? actual instanceof Date && actual.getTime() === value.getTime()
        : actual === value;
    }) &&
    (!requiresVersion || record.version === 0)
  );
}

function isConcurrentSeedConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'P2002' || error.code === 'P2034')
  );
}

async function main(): Promise<void> {
  assertDevelopmentEnvironment();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required to run the development seed');

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  }) as unknown as SeedClient;
  try {
    const summary = await runDevelopmentSeed(client);
    console.log(JSON.stringify(summary));
  } finally {
    await client.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
