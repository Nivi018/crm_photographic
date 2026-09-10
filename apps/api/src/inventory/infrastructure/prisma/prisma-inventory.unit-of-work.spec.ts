import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { ArticleType } from '@crm-photografy/shared';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Article } from '../../domain/articles/article';
import {
  ArticleCategoryNotFoundError,
  ArticleService,
} from '../../application/articles/article.service';
import { PrismaClient } from '../../../infrastructure/prisma/generated/client';
import { PrismaInventoryUnitOfWork } from './prisma-inventory.unit-of-work';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Prisma integration tests');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const unitOfWork = new PrismaInventoryUnitOfWork(prisma);
const categoryIds: string[] = [];
const articleIds: string[] = [];

describe('PrismaInventoryUnitOfWork', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.movement.deleteMany({ where: { articleId: { in: articleIds } } });
    await prisma.article.deleteMany({ where: { id: { in: articleIds } } });
    await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
    articleIds.length = 0;
    categoryIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rolls back an article when a later operation in the unit of work fails', async () => {
    const categoryId = randomUUID();
    const articleId = randomUUID();
    categoryIds.push(categoryId);
    articleIds.push(articleId);
    await prisma.category.create({
      data: { id: categoryId, name: 'Fondos transaccion', normalizedName: 'fondos transaccion' },
    });
    const article = Article.create({
      id: articleId,
      name: 'Fondo blanco transaccion',
      type: ArticleType.Sale,
      category: { id: categoryId, isActive: true },
      initialStock: 1,
      minimumStock: 0,
    });

    await expect(
      unitOfWork.execute(async ({ articles }) => {
        await articles.save(article);
        throw new Error('initial movement could not be saved');
      }),
    ).rejects.toThrow('initial movement could not be saved');

    await expect(prisma.article.findUnique({ where: { id: articleId } })).resolves.toBeNull();
  });

  it('persists an article and its initial-stock movement together', async () => {
    const categoryId = randomUUID();
    categoryIds.push(categoryId);
    await prisma.category.create({
      data: { id: categoryId, name: 'Fondos iniciales', normalizedName: 'fondos iniciales' },
    });
    const service = new ArticleService(unitOfWork);

    const created = await service.create({
      name: 'Fondo blanco inicial',
      type: ArticleType.Sale,
      categoryId,
      initialStock: 3,
      minimumStock: 1,
    });
    articleIds.push(created.entity.id);

    await expect(
      prisma.article.findUnique({ where: { id: created.entity.id } }),
    ).resolves.toMatchObject({
      currentStock: 3,
      initialStock: 3,
    });
    await expect(
      prisma.movement.findMany({ where: { articleId: created.entity.id } }),
    ).resolves.toMatchObject([
      { appliedQuantity: 3, reason: 'Stock inicial', stockBefore: 0, stockAfter: 3 },
    ]);
  });

  it('returns a typed error when the selected category is missing but active categories exist', async () => {
    const categoryId = randomUUID();
    categoryIds.push(categoryId);
    await prisma.category.create({
      data: { id: categoryId, name: 'Fondos disponibles', normalizedName: 'fondos disponibles' },
    });
    const service = new ArticleService(unitOfWork);

    await expect(
      service.create({
        name: 'Fondo sin categoria',
        type: ArticleType.Sale,
        categoryId: randomUUID(),
        initialStock: 0,
        minimumStock: 0,
      }),
    ).rejects.toThrow(ArticleCategoryNotFoundError);
  });
});
