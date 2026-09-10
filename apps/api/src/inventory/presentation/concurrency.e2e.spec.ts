import 'dotenv/config';
import 'reflect-metadata';

import { PrismaPg } from '@prisma/adapter-pg';
import { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaClient } from '../../infrastructure/prisma/generated/client';
import { ArticleService } from '../application/articles/article.service';
import { type ArticleRepository } from '../application/ports/article-repository.port';
import {
  type InventoryRepositories,
  type InventoryUnitOfWork,
} from '../application/ports/inventory-unit-of-work.port';
import { PrismaInventoryUnitOfWork } from '../infrastructure/prisma/prisma-inventory.unit-of-work';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { configureApplication } from '../../api.bootstrap';
import { AppModule } from '../../app.module';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error('DATABASE_URL is required for concurrency E2E tests');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const articleIds: string[] = [];
const categoryIds: string[] = [];

describe('Inventory concurrency (E2E)', () => {
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

  it('cancels an operation after a second optimistic-lock conflict', async () => {
    const article = await createArticle();
    const service = new ArticleService(new ConflictInjectingUnitOfWork(prisma, 2));

    await expect(
      service.registerEntry({
        articleId: article.entity.id,
        expectedVersion: 0,
        quantity: 1,
        reason: 'Conflicto E2E',
      }),
    ).rejects.toMatchObject({ name: 'ConcurrentModificationError' });
  });

  it('requires reconfirmation when the retried operation becomes negative', async () => {
    const article = await createArticle();
    const entry = await request('POST', `/articles/${article.entity.id}/movements/entries`, {
      expectedVersion: 0,
      quantity: 1,
      reason: 'Existencia E2E',
    });
    expect(entry.status).toBe(201);

    const service = new ArticleService(
      new ConflictInjectingUnitOfWork(prisma, 1, { currentStock: 0 }),
    );
    await expect(
      service.registerExit({
        expectedVersion: 1,
        articleId: article.entity.id,
        quantity: 1,
        reason: 'Salida E2E',
      }),
    ).rejects.toMatchObject({ name: 'NegativeStockConfirmationRequiredError', stockAfter: -1 });
  });

  async function createArticle() {
    const categoryResponse = await request('POST', '/categories', {
      name: `Concurrencia ${Date.now()}`,
    });
    const category = await categoryResponse.json();
    categoryIds.push(category.entity.id);
    const articleResponse = await request('POST', '/articles', {
      categoryId: category.entity.id,
      initialStock: 0,
      minimumStock: 0,
      name: `Articulo concurrencia ${category.entity.id}`,
      type: 'SALE',
    });
    const article = await articleResponse.json();
    articleIds.push(article.entity.id);
    return article;
  }

  function request(method: string, path: string, body?: object): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
      method,
      ...(body
        ? { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }
        : {}),
    });
  }
});

class ConflictInjectingUnitOfWork implements InventoryUnitOfWork {
  private remainingConflicts: number;

  constructor(
    private readonly prisma: PrismaClient,
    conflicts: number,
    private readonly changes: { currentStock?: number } = {},
  ) {
    this.remainingConflicts = conflicts;
  }

  async execute<T>(operation: (repositories: InventoryRepositories) => Promise<T>): Promise<T> {
    const unitOfWork = new PrismaInventoryUnitOfWork(this.prisma);

    return unitOfWork.execute(async (repositories) => {
      const articles = Object.create(repositories.articles) as ArticleRepository;
      articles.save = async (article, expectedVersion) => {
        if (expectedVersion !== undefined && this.remainingConflicts > 0) {
          this.remainingConflicts -= 1;
          await this.prisma.article.update({
            where: { id: article.id },
            data: { version: { increment: 1 }, ...this.changes },
          });
        }

        return repositories.articles.save(article, expectedVersion);
      };

      return operation({ ...repositories, articles });
    });
  }
}
