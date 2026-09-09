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
      categoryId: category.entity.id,
      initialStock: 5,
      minimumStock: 5,
      name: '  Camara principal E2E  ',
      type: 'SALE',
    });

    expect(created.status).toBe(201);
    const article = await created.json();
    articleIds.push(article.entity.id);
    expect(article).toMatchObject({
      entity: { currentStock: 0, isActive: true, name: 'Camara principal E2E' },
      version: 0,
    });

    const duplicate = await request(articleUrl, 'POST', '', {
      categoryId: category.entity.id,
      initialStock: 0,
      minimumStock: 0,
      name: 'camara principal e2e',
      type: 'SALE',
    });
    expect(duplicate.status).toBe(409);
    await expect(duplicate.json()).resolves.toMatchObject({ code: 'NAME_CONFLICT' });

    const found = await request(articleUrl, 'GET', `/${article.entity.id}`);
    expect(found.status).toBe(200);
    await expect(found.json()).resolves.toMatchObject({ entity: { id: article.entity.id } });

    const listed = await request(
      articleUrl,
      'GET',
      `?name=CAMARA&type=SALE&categoryId=${category.entity.id}&isActive=true`,
    );
    expect(listed.status).toBe(200);
    const articleList = await listed.json();
    expect(articleList).toMatchObject({ page: 1, pageSize: 25, totalItems: 1 });
    expect(articleList.items[0]).toMatchObject({ entity: { id: article.entity.id } });

    const lowStock = await request(articleUrl, 'GET', '/low-stock');
    expect(lowStock.status).toBe(200);
    const lowStockList = await lowStock.json();
    expect(lowStockList.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entity: expect.objectContaining({ id: article.entity.id }) }),
      ]),
    );

    const updated = await request(articleUrl, 'PATCH', `/${article.entity.id}`, {
      categoryId: category.entity.id,
      confirmNegativeStock: false,
      expectedVersion: 0,
      initialStock: 8,
      minimumStock: 3,
      name: 'Camara principal editada E2E',
      type: 'INTERNAL_SUPPLY',
    });
    expect(updated.status).toBe(200);
    const editedArticle = await updated.json();
    expect(editedArticle).toMatchObject({
      entity: { currentStock: 8, name: 'Camara principal editada E2E', type: 'INTERNAL_SUPPLY' },
      version: 1,
    });

    const deactivated = await request(articleUrl, 'POST', `/${article.entity.id}/deactivate`, {
      expectedVersion: 1,
    });
    expect(deactivated.status).toBe(201);
    await expect(deactivated.json()).resolves.toMatchObject({
      entity: { isActive: false },
      version: 2,
    });

    const reactivated = await request(articleUrl, 'POST', `/${article.entity.id}/reactivate`, {
      expectedVersion: 2,
    });
    expect(reactivated.status).toBe(201);
    await expect(reactivated.json()).resolves.toMatchObject({
      entity: { isActive: true },
      version: 3,
    });
  });

  it('deletes an article with zero stock and no movements through HTTP', async () => {
    const category = await createCategory('Eliminacion E2E');
    const created = await request(articleUrl, 'POST', '', {
      categoryId: category.entity.id,
      initialStock: 0,
      minimumStock: 0,
      name: 'Articulo eliminable E2E',
      type: 'SALE',
    });
    const article = await created.json();
    articleIds.push(article.entity.id);

    const removed = await request(articleUrl, 'DELETE', `/${article.entity.id}`, {
      expectedVersion: 0,
    });
    expect(removed.status).toBe(200);
    articleIds.length = 0;
    await expect(
      prisma.article.findUnique({ where: { id: article.entity.id } }),
    ).resolves.toBeNull();
  });

  async function createCategory(name: string) {
    const response = await request(categoryUrl, 'POST', '', { name });
    expect(response.status).toBe(201);
    const category = await response.json();
    categoryIds.push(category.entity.id);
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
