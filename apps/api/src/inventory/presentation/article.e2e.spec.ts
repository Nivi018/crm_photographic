import 'dotenv/config';
import 'reflect-metadata';

import { PrismaPg } from '@prisma/adapter-pg';
import { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaClient } from '../../infrastructure/prisma/generated/client';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { configureApplication } from '../../api.bootstrap';
import { AppModule } from '../../app.module';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for article E2E tests');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const articleIds: string[] = [];
const categoryIds: string[] = [];

describe('Article endpoints (E2E)', () => {
  let app: INestApplication;
  let articleUrl: string;
  let categoryUrl: string;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    await prisma.$connect();
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    const baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}/api/inventory`;
    articleUrl = `${baseUrl}/articles`;
    categoryUrl = `${baseUrl}/categories`;
  });

  afterEach(async () => {
    await prisma.movement.deleteMany({ where: { articleId: { in: articleIds } } });
    await prisma.article.deleteMany({ where: { id: { in: articleIds } } });
    await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
    articleIds.length = 0;
    categoryIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
    await prisma.$disconnect();
  });

  it('creates, queries, filters, edits, and changes article state through HTTP', async () => {
    const category = await createCategory('Equipo E2E');
    const created = await request(articleUrl, 'POST', '', {
      categoryId: category.data.id,
      initialStock: 5,
      minimumStock: 5,
      name: '  Camara principal E2E  ',
      type: 'SALE',
    });

    expect(created.status).toBe(201);
    const article = await created.json();
    articleIds.push(article.data.id);
    expect(article).toMatchObject({
      data: { currentStock: 5, isActive: true, name: 'Camara principal E2E', version: 1 },
    });
    expect(Object.keys(article.data).sort()).toEqual([
      'categoryId',
      'currentStock',
      'hasLowStock',
      'id',
      'initialStock',
      'isActive',
      'minimumStock',
      'name',
      'type',
      'version',
    ]);

    const duplicate = await request(articleUrl, 'POST', '', {
      categoryId: category.data.id,
      initialStock: 0,
      minimumStock: 0,
      name: 'camara principal e2e',
      type: 'SALE',
    });
    expect(duplicate.status).toBe(409);
    await expect(duplicate.json()).resolves.toMatchObject({ code: 'NAME_CONFLICT' });

    const found = await request(articleUrl, 'GET', `/${article.data.id}`);
    expect(found.status).toBe(200);
    await expect(found.json()).resolves.toMatchObject({ data: { id: article.data.id } });

    const listed = await request(
      articleUrl,
      'GET',
      `?name=CAMARA&type=SALE&categoryId=${category.data.id}&isActive=true`,
    );
    expect(listed.status).toBe(200);
    const articleList = await listed.json();
    expect(articleList).toMatchObject({ meta: { page: 1, pageSize: 25, totalItems: 1 } });
    expect(articleList.data[0]).toMatchObject({ id: article.data.id });

    const lowStock = await request(articleUrl, 'GET', '/low-stock');
    expect(lowStock.status).toBe(200);
    const lowStockList = await lowStock.json();
    expect(lowStockList.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: article.data.id })]),
    );

    const updated = await request(articleUrl, 'PATCH', `/${article.data.id}`, {
      categoryId: category.data.id,
      confirmNegativeStock: false,
      expectedVersion: 1,
      initialStock: 8,
      minimumStock: 3,
      name: 'Camara principal editada E2E',
      type: 'INTERNAL_SUPPLY',
    });
    expect(updated.status).toBe(200);
    const editedArticle = await updated.json();
    expect(editedArticle).toMatchObject({
      data: {
        currentStock: 8,
        name: 'Camara principal editada E2E',
        type: 'INTERNAL_SUPPLY',
        version: 2,
      },
    });

    const deactivated = await request(articleUrl, 'POST', `/${article.data.id}/deactivate`, {
      expectedVersion: 2,
    });
    expect(deactivated.status).toBe(200);
    await expect(deactivated.json()).resolves.toMatchObject({
      data: { isActive: false, version: 3 },
    });

    const reactivated = await request(articleUrl, 'POST', `/${article.data.id}/reactivate`, {
      expectedVersion: 3,
    });
    expect(reactivated.status).toBe(200);
    await expect(reactivated.json()).resolves.toMatchObject({
      data: { isActive: true, version: 4 },
    });
  });

  it('deletes an article with zero stock and no movements through HTTP', async () => {
    const category = await createCategory('Eliminacion E2E');
    const created = await request(articleUrl, 'POST', '', {
      categoryId: category.data.id,
      initialStock: 0,
      minimumStock: 0,
      name: 'Articulo eliminable E2E',
      type: 'SALE',
    });
    const article = await created.json();
    articleIds.push(article.data.id);

    const removed = await request(articleUrl, 'DELETE', `/${article.data.id}`, {
      expectedVersion: 0,
    });
    expect(removed.status).toBe(200);
    articleIds.length = 0;
    await expect(prisma.article.findUnique({ where: { id: article.data.id } })).resolves.toBeNull();
  });

  it('validates UUID route parameters and boolean query values strictly', async () => {
    const invalidId = await request(articleUrl, 'GET', '/not-a-uuid');
    expect(invalidId.status).toBe(400);
    await expect(invalidId.json()).resolves.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { fields: [expect.objectContaining({ field: 'id' })] },
    });

    const invalidBoolean = await request(articleUrl, 'GET', '?isActive=1');
    expect(invalidBoolean.status).toBe(400);
    await expect(invalidBoolean.json()).resolves.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { fields: [expect.objectContaining({ field: 'isActive' })] },
    });

    const missing = await request(articleUrl, 'GET', '/0198de9e-5f20-7c99-9ed4-623d44f8a2e1');
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({ code: 'NOT_FOUND' });
  });

  async function createCategory(name: string) {
    const response = await request(categoryUrl, 'POST', '', { name });
    expect(response.status).toBe(201);
    const category = await response.json();
    categoryIds.push(category.data.id);
    return category;
  }

  function request(url: string, method: string, path = '', body?: object): Promise<Response> {
    return fetch(`${url}${path}`, {
      method,
      ...(body
        ? {
            body: JSON.stringify(body),
            headers: { 'content-type': 'application/json' },
          }
        : {}),
    });
  }
});
