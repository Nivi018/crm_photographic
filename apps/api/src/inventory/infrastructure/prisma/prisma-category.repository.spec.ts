import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Category } from '../../domain/categories/category';
import { PrismaClient } from '../../../infrastructure/prisma/generated/client';
import { PrismaCategoryRepository } from './prisma-category.repository';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Prisma integration tests');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const repository = new PrismaCategoryRepository(prisma);
const categoryIds: string[] = [];

describe('PrismaCategoryRepository', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.article.deleteMany({ where: { categoryId: { in: categoryIds } } });
    await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
    categoryIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('stores and retrieves a category by its normalized name with its version', async () => {
    const category = createCategory('  Iluminacio\u0301n  ');

    const stored = await repository.save(category);
    const found = await repository.findByNormalizedName('iluminacion');

    expect(stored.version).toBe(0);
    expect(found).toMatchObject({
      version: 0,
      entity: {
        id: category.id,
        name: 'Iluminacio\u0301n',
        normalizedName: 'iluminacion',
        isActive: true,
      },
    });
  });

  it('enforces normalized-name uniqueness in PostgreSQL for active and inactive categories', async () => {
    await repository.save(createCategory('Camaras'));
    const inactiveDuplicate = Category.rehydrate({
      id: trackId(),
      name: '  Ca\u0301maras ',
      isActive: false,
    });

    await expect(repository.save(inactiveDuplicate)).rejects.toMatchObject({ code: 'P2002' });
  });

  it('updates a category only when its expected version matches', async () => {
    const category = createCategory('Fondos');
    const stored = await repository.save(category);
    category.rename('Fondos de estudio');

    const updated = await repository.save(category, stored.version);

    expect(updated.version).toBe(1);
    expect(updated.entity.normalizedName).toBe('fondos de estudio');
  });

  it('counts active and inactive article associations separately', async () => {
    const category = createCategory('Accesorios');
    await repository.save(category);
    await prisma.article.createMany({
      data: [articleRecord(category.id, true), articleRecord(category.id, false)],
    });

    await expect(repository.countArticleAssociations(category.id)).resolves.toEqual({
      active: 1,
      inactive: 1,
    });
  });

  it('lists categories by normalized name with twenty-five items per page', async () => {
    await Promise.all(
      Array.from({ length: 26 }, (_, index) =>
        repository.save(createCategory(`Categoria ${String(index).padStart(2, '0')}`)),
      ),
    );

    const firstPage = await repository.list({ page: 1 });
    const secondPage = await repository.list({ page: 2 });

    expect(firstPage).toMatchObject({ page: 1, pageSize: 25, totalItems: 26, totalPages: 2 });
    expect(firstPage.items).toHaveLength(25);
    expect(firstPage.items[0]?.entity.normalizedName).toBe('categoria 00');
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0]?.entity.normalizedName).toBe('categoria 25');
  });
});

function createCategory(name: string): Category {
  return Category.create({ id: trackId(), name });
}

function trackId(): string {
  const id = randomUUID();
  categoryIds.push(id);
  return id;
}

function articleRecord(categoryId: string, isActive: boolean) {
  const id = randomUUID();

  return {
    id,
    name: `Test article ${id}`,
    normalizedName: `test article ${id}`,
    type: 'SALE' as const,
    categoryId,
    initialStock: 0,
    currentStock: 0,
    minimumStock: 0,
    isActive,
  };
}
