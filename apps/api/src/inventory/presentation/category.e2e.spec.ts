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
  throw new Error('DATABASE_URL is required for category E2E tests');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const categoryIds: string[] = [];

describe('Category endpoints (E2E)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    await prisma.$connect();
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}/api/inventory/categories`;
  });

  afterEach(async () => {
    await prisma.article.deleteMany({ where: { categoryId: { in: categoryIds } } });
    await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
    categoryIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
    await moduleRef.close();
    await prisma.$disconnect();
  });

  it('creates, lists, renames, changes state, and deletes categories through HTTP', async () => {
    const created = await request('POST', '', { name: '  Iluminacion E2E  ' });

    expect(created.status).toBe(201);
    const category = await created.json();
    categoryIds.push(category.entity.id);
    expect(category).toMatchObject({
      entity: { name: 'Iluminacion E2E', isActive: true },
      version: 0,
    });

    const duplicate = await request('POST', '', { name: 'iluminacion e2e' });
    expect(duplicate.status).toBe(409);
    await expect(duplicate.json()).resolves.toMatchObject({ code: 'NAME_CONFLICT' });

    const listed = await request('GET');
    expect(listed.status).toBe(200);
    const categoryList = await listed.json();
    expect(categoryList).toMatchObject({ page: 1, pageSize: 25 });
    expect(
      categoryList.items.some(
        (item: { entity: { id: string } }) => item.entity.id === category.entity.id,
      ),
    ).toBe(true);

    const renamed = await request('PATCH', `/${category.entity.id}`, {
      expectedVersion: category.version,
      name: 'Fondos E2E',
    });
    expect(renamed.status).toBe(200);
    const renamedCategory = await renamed.json();
    expect(renamedCategory).toMatchObject({ entity: { name: 'Fondos E2E' }, version: 1 });

    const deactivated = await request('POST', `/${category.entity.id}/deactivate`, {
      expectedVersion: 1,
    });
    expect(deactivated.status).toBe(201);
    const inactiveCategory = await deactivated.json();
    expect(inactiveCategory).toMatchObject({ entity: { isActive: false }, version: 2 });

    const reactivated = await request('POST', `/${category.entity.id}/reactivate`, {
      expectedVersion: 2,
    });
    expect(reactivated.status).toBe(201);
    await expect(reactivated.json()).resolves.toMatchObject({
      entity: { isActive: true },
      version: 3,
    });

    const removed = await request('DELETE', `/${category.entity.id}`, { expectedVersion: 3 });
    expect(removed.status).toBe(200);
    categoryIds.length = 0;
    await expect(
      prisma.category.findUnique({ where: { id: category.entity.id } }),
    ).resolves.toBeNull();
  });

  it('rejects deactivation and deletion while the category has associated articles', async () => {
    const created = await request('POST', '', { name: 'Con asociaciones E2E' });
    const category = await created.json();
    categoryIds.push(category.entity.id);
    await prisma.article.create({
      data: {
        categoryId: category.entity.id,
        currentStock: 0,
        initialStock: 0,
        isActive: true,
        minimumStock: 0,
        name: `Articulo E2E ${category.entity.id}`,
        normalizedName: `articulo e2e ${category.entity.id}`,
        type: 'SALE',
      },
    });

    const deactivation = await request('POST', `/${category.entity.id}/deactivate`, {
      expectedVersion: category.version,
    });
    expect(deactivation.status).toBe(409);
    await expect(deactivation.json()).resolves.toMatchObject({ code: 'DEPENDENCY_CONFLICT' });

    const deletion = await request('DELETE', `/${category.entity.id}`, {
      expectedVersion: category.version,
    });
    expect(deletion.status).toBe(409);
    await expect(deletion.json()).resolves.toMatchObject({ code: 'DEPENDENCY_CONFLICT' });
  });

  function request(method: string, path = '', body?: object): Promise<Response> {
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
