import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { ArticleType } from '@crm-photografy/shared';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Article } from '../../domain/articles/article';
import { PrismaClient } from '../../../infrastructure/prisma/generated/client';
import { PrismaArticleRepository } from './prisma-article.repository';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Prisma integration tests');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const repository = new PrismaArticleRepository(prisma);
const articleIds: string[] = [];
const categoryIds: string[] = [];

describe('PrismaArticleRepository', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.article.deleteMany({ where: { id: { in: articleIds } } });
    await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
    articleIds.length = 0;
    categoryIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('stores and retrieves an article by its normalized name with its version', async () => {
    const category = await createCategory('Iluminacion');
    const article = createArticle({ name: '  Ca\u0301mara principal  ', category });

    const stored = await repository.save(article);
    const found = await repository.findByNormalizedName('camara principal');

    expect(stored.version).toBe(0);
    expect(found).toMatchObject({
      version: 0,
      entity: {
        id: article.id,
        name: 'Ca\u0301mara principal',
        normalizedName: 'camara principal',
        categoryId: category.id,
        type: ArticleType.Sale,
        isActive: true,
      },
    });
  });

  it('enforces normalized-name uniqueness for active and inactive articles', async () => {
    const category = await createCategory('Camaras');
    await repository.save(createArticle({ name: 'Camara', category }));
    const inactiveDuplicate = createArticle({ name: '  Ca\u0301mara ', category });
    inactiveDuplicate.deactivate();

    await expect(repository.save(inactiveDuplicate)).rejects.toMatchObject({ code: 'P2002' });
  });

  it('updates an article only when its expected version matches', async () => {
    const category = await createCategory('Fondos');
    const article = createArticle({ name: 'Fondo blanco', category });
    const stored = await repository.save(article);
    article.edit({
      name: 'Fondo blanco mate',
      type: ArticleType.Sale,
      category,
      initialStock: 0,
      minimumStock: 1,
    });

    const updated = await repository.save(article, stored.version);

    expect(updated).toMatchObject({ version: 1, entity: { normalizedName: 'fondo blanco mate' } });
  });

  it('combines normalized-name, type, category, and active-state filters', async () => {
    const cameras = await createCategory('Camaras');
    const supplies = await createCategory('Insumos');
    await repository.save(createArticle({ name: 'Ca\u0301mara principal', category: cameras }));
    await repository.save(
      createArticle({
        name: 'Ca\u0301mara secundaria',
        category: cameras,
        type: ArticleType.InternalSupply,
      }),
    );
    await repository.save(createArticle({ name: 'Ca\u0301mara de respaldo', category: supplies }));
    const inactive = createArticle({ name: 'Ca\u0301mara inactiva', category: cameras });
    inactive.deactivate();
    await repository.save(inactive);

    const page = await repository.list({
      page: 1,
      normalizedName: 'camara',
      type: ArticleType.Sale,
      categoryId: cameras.id,
      isActive: true,
    });

    expect(page).toMatchObject({ page: 1, totalItems: 1, totalPages: 1 });
    expect(page.items.map(({ entity }) => entity.name)).toEqual(['Ca\u0301mara principal']);
  });

  it('lists only active articles at or below their minimum stock as low-stock alerts', async () => {
    const category = await createCategory('Accesorios');
    await repository.save(
      rehydrateArticle({
        name: 'Bateria baja',
        categoryId: category.id,
        currentStock: 1,
        minimumStock: 3,
      }),
    );
    await repository.save(
      rehydrateArticle({
        name: 'Album bajo',
        categoryId: category.id,
        currentStock: 2,
        minimumStock: 2,
      }),
    );
    await repository.save(
      rehydrateArticle({
        name: 'Tripode estable',
        categoryId: category.id,
        currentStock: 4,
        minimumStock: 3,
      }),
    );
    await repository.save(
      rehydrateArticle({
        name: 'Camara inactiva',
        categoryId: category.id,
        currentStock: 0,
        minimumStock: 1,
        isActive: false,
      }),
    );

    const page = await repository.listLowStock({ page: 1 });

    expect(page).toMatchObject({ page: 1, pageSize: 25, totalItems: 2, totalPages: 1 });
    expect(page.items.map(({ entity }) => entity.normalizedName)).toEqual([
      'album bajo',
      'bateria baja',
    ]);
  });

  it('lists articles by normalized name with twenty-five items per page', async () => {
    const category = await createCategory('Paginacion');
    await Promise.all(
      Array.from({ length: 26 }, (_, index) =>
        repository.save(
          createArticle({ name: `Articulo ${String(index).padStart(2, '0')}`, category }),
        ),
      ),
    );

    const firstPage = await repository.list({ page: 1 });
    const secondPage = await repository.list({ page: 2 });

    expect(firstPage).toMatchObject({ page: 1, pageSize: 25, totalItems: 26, totalPages: 2 });
    expect(firstPage.items).toHaveLength(25);
    expect(firstPage.items[0]?.entity.normalizedName).toBe('articulo 00');
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0]?.entity.normalizedName).toBe('articulo 25');
  });
});

async function createCategory(name: string): Promise<{ id: string; isActive: true }> {
  const id = randomUUID();
  categoryIds.push(id);
  await prisma.category.create({ data: { id, name, normalizedName: name.toLowerCase() } });

  return { id, isActive: true };
}

function createArticle({
  name,
  category,
  type = ArticleType.Sale,
}: {
  name: string;
  category: { id: string; isActive: boolean };
  type?: ArticleType;
}): Article {
  const id = randomUUID();
  articleIds.push(id);

  return Article.create({ id, name, type, category, initialStock: 0, minimumStock: 0 });
}

function rehydrateArticle({
  name,
  categoryId,
  currentStock,
  minimumStock,
  isActive = true,
}: {
  name: string;
  categoryId: string;
  currentStock: number;
  minimumStock: number;
  isActive?: boolean;
}): Article {
  const id = randomUUID();
  articleIds.push(id);

  return Article.rehydrate({
    id,
    name,
    type: ArticleType.Sale,
    categoryId,
    initialStock: 0,
    currentStock,
    minimumStock,
    isActive,
  });
}
