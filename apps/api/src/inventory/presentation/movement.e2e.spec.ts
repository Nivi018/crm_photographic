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
  throw new Error('DATABASE_URL is required for movement E2E tests');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const articleIds: string[] = [];
const categoryIds: string[] = [];

describe('Movement endpoints (E2E)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    await prisma.$connect();
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}/api/inventory`;
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

  it('records entries, confirmed negative exits, adjustments, and movement history through HTTP', async () => {
    const article = await createArticle();

    const entry = await request('POST', `/articles/${article.entity.id}/movements/entries`, {
      expectedVersion: 0,
      quantity: 5,
      reason: 'Reposicion E2E',
    });
    expect(entry.status).toBe(201);
    await expect(entry.json()).resolves.toMatchObject({ entity: { currentStock: 5 }, version: 1 });

    const exitWarning = await request('POST', `/articles/${article.entity.id}/movements/exits`, {
      expectedVersion: 1,
      quantity: 7,
      reason: 'Uso E2E',
    });
    expect(exitWarning.status).toBe(400);
    await expect(exitWarning.json()).resolves.toMatchObject({
      code: 'NEGATIVE_STOCK_CONFIRMATION_REQUIRED',
    });

    const confirmedExit = await request('POST', `/articles/${article.entity.id}/movements/exits`, {
      confirmNegativeStock: true,
      expectedVersion: 1,
      quantity: 7,
      reason: 'Uso E2E',
    });
    expect(confirmedExit.status).toBe(201);
    await expect(confirmedExit.json()).resolves.toMatchObject({
      entity: { currentStock: -2 },
      version: 2,
    });

    const finalStock = await request(
      'POST',
      `/articles/${article.entity.id}/movements/final-stock-adjustments`,
      { expectedVersion: 2, finalStock: 3 },
    );
    expect(finalStock.status).toBe(201);
    await expect(finalStock.json()).resolves.toMatchObject({
      entity: { currentStock: 3 },
      version: 3,
    });

    const deltaWarning = await request(
      'POST',
      `/articles/${article.entity.id}/movements/delta-adjustments`,
      {
        expectedVersion: 3,
        quantity: -5,
        reason: 'Correccion E2E',
      },
    );
    expect(deltaWarning.status).toBe(400);
    await expect(deltaWarning.json()).resolves.toMatchObject({
      code: 'NEGATIVE_STOCK_CONFIRMATION_REQUIRED',
    });

    const confirmedDelta = await request(
      'POST',
      `/articles/${article.entity.id}/movements/delta-adjustments`,
      {
        confirmNegativeStock: true,
        expectedVersion: 3,
        quantity: -5,
        reason: 'Correccion E2E',
      },
    );
    expect(confirmedDelta.status).toBe(201);
    await expect(confirmedDelta.json()).resolves.toMatchObject({
      entity: { currentStock: -2 },
      version: 4,
    });

    const history = await request('GET', `/articles/${article.entity.id}/movements?page=1`);
    expect(history.status).toBe(200);
    const articleHistory = await history.json();
    expect(articleHistory).toMatchObject({ page: 1, pageSize: 25, totalItems: 4 });
    expect(articleHistory.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'ENTRY', appliedQuantity: 5, reason: 'Reposicion E2E' }),
        expect.objectContaining({ kind: 'EXIT', appliedQuantity: -7, reason: 'Uso E2E' }),
        expect.objectContaining({
          adjustmentMode: 'FINAL_STOCK',
          appliedQuantity: 5,
          reason: 'Ajuste de inventario',
        }),
        expect.objectContaining({
          adjustmentMode: 'DELTA',
          appliedQuantity: -5,
          reason: 'Correccion E2E',
        }),
      ]),
    );

    const globalHistory = await request('GET', '/movements?page=1');
    expect(globalHistory.status).toBe(200);
    const movements = await globalHistory.json();
    expect(
      movements.items.some(
        (movement: { articleId: string }) => movement.articleId === article.entity.id,
      ),
    ).toBe(true);
  });

  it('rejects a movement that would exceed the stock range', async () => {
    const article = await createArticle();
    const maximumEntry = await request('POST', `/articles/${article.entity.id}/movements/entries`, {
      expectedVersion: 0,
      quantity: 999_999_999,
      reason: 'Limite E2E',
    });
    expect(maximumEntry.status).toBe(201);

    const response = await request('POST', `/articles/${article.entity.id}/movements/entries`, {
      expectedVersion: 1,
      quantity: 1,
      reason: 'Fuera de rango E2E',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: 'STOCK_OUT_OF_RANGE' });
  });

  async function createArticle() {
    const categoryResponse = await request('POST', '/categories', { name: 'Movimientos E2E' });
    expect(categoryResponse.status).toBe(201);
    const category = await categoryResponse.json();
    categoryIds.push(category.entity.id);

    const articleResponse = await request('POST', '/articles', {
      categoryId: category.entity.id,
      initialStock: 0,
      minimumStock: 0,
      name: `Articulo movimientos ${category.entity.id}`,
      type: 'SALE',
    });
    expect(articleResponse.status).toBe(201);
    const article = await articleResponse.json();
    articleIds.push(article.entity.id);
    return article;
  }

  function request(method: string, path: string, body?: object): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
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
