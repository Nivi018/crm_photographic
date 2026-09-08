import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { ArticleType, MovementKind, MovementSource } from '@crm-photografy/shared';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Movement } from '../../domain/stock/movement';
import { PrismaClient } from '../../../infrastructure/prisma/generated/client';
import { PrismaMovementRepository } from './prisma-movement.repository';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Prisma integration tests');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const repository = new PrismaMovementRepository(prisma);
const movementIds: string[] = [];
const articleIds: string[] = [];
const categoryIds: string[] = [];

describe('PrismaMovementRepository', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.movement.deleteMany({ where: { id: { in: movementIds } } });
    await prisma.article.deleteMany({ where: { id: { in: articleIds } } });
    await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
    movementIds.length = 0;
    articleIds.length = 0;
    categoryIds.length = 0;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('allocates a sequence and appends an immutable movement preserving its timestamp', async () => {
    const articleId = await createArticle('Movimiento creado');
    const sequence = await repository.nextSequence();
    const movement = Movement.recordEntry({
      id: trackMovementId(),
      sequence,
      articleId,
      stockBefore: 2,
      quantity: 3,
      reason: 'Compra',
    });

    await repository.append(movement);

    const record = await prisma.movement.findUnique({ where: { id: movement.id } });
    expect(record).toMatchObject({
      id: movement.id,
      sequence,
      articleId,
      kind: MovementKind.Entry,
      source: MovementSource.Manual,
      appliedQuantity: 3,
      reason: 'Compra',
      stockBefore: 2,
      stockAfter: 5,
    });
    expect(record?.occurredAt).toEqual(movement.occurredAt);
  });

  it('counts movements belonging to one article', async () => {
    const articleId = await createArticle('Conteo de movimientos');
    const otherArticleId = await createArticle('Otro articulo');
    await createMovement({ articleId });
    await createMovement({ articleId });
    await createMovement({ articleId: otherArticleId });

    await expect(repository.countByArticleId(articleId)).resolves.toBe(2);
  });

  it('lists movements by date descending, article name ascending, then sequence descending', async () => {
    const alphaArticleId = await createArticle('Alpha articulo');
    const zetaArticleId = await createArticle('Zeta articulo');
    const occurredAt = new Date('2026-09-08T12:00:00.000Z');
    const oldestSequence = await repository.nextSequence();
    const alphaMovement = await createMovement({
      articleId: alphaArticleId,
      sequence: oldestSequence,
      occurredAt,
    });
    const zetaOlderMovement = await createMovement({
      articleId: zetaArticleId,
      sequence: oldestSequence + 1n,
      occurredAt,
    });
    const zetaNewerMovement = await createMovement({
      articleId: zetaArticleId,
      sequence: oldestSequence + 2n,
      occurredAt,
    });

    const page = await repository.list({ page: 1 });

    expect(page.items.map((movement) => movement.id)).toEqual([
      alphaMovement.id,
      zetaNewerMovement.id,
      zetaOlderMovement.id,
    ]);
    expect(page.items[0]?.occurredAt).toEqual(occurredAt);
  });

  it('filters movements by article and paginates with twenty-five items per page', async () => {
    const articleId = await createArticle('Paginacion de movimientos');
    const otherArticleId = await createArticle('Movimiento excluido');
    const firstSequence = await repository.nextSequence();
    await Promise.all(
      Array.from({ length: 26 }, (_, index) =>
        createMovement({ articleId, sequence: firstSequence + BigInt(index) }),
      ),
    );
    await createMovement({ articleId: otherArticleId, sequence: firstSequence + 26n });

    const firstPage = await repository.list({ articleId, page: 1 });
    const secondPage = await repository.list({ articleId, page: 2 });

    expect(firstPage).toMatchObject({ page: 1, pageSize: 25, totalItems: 26, totalPages: 2 });
    expect(firstPage.items).toHaveLength(25);
    expect(secondPage.items).toHaveLength(1);
  });
});

async function createArticle(name: string): Promise<string> {
  const categoryId = randomUUID();
  const articleId = randomUUID();
  categoryIds.push(categoryId);
  articleIds.push(articleId);
  await prisma.category.create({
    data: { id: categoryId, name, normalizedName: name.toLowerCase() },
  });
  await prisma.article.create({
    data: {
      id: articleId,
      name,
      normalizedName: name.toLowerCase(),
      type: ArticleType.Sale,
      categoryId,
      initialStock: 0,
      currentStock: 0,
      minimumStock: 0,
    },
  });

  return articleId;
}

async function createMovement({
  articleId,
  sequence,
  occurredAt = new Date(),
}: {
  articleId: string;
  sequence?: bigint;
  occurredAt?: Date;
}): Promise<{ id: string }> {
  const id = trackMovementId();
  const persistedSequence = sequence ?? (await repository.nextSequence());
  await prisma.movement.create({
    data: {
      id,
      sequence: persistedSequence,
      articleId,
      kind: MovementKind.Entry,
      source: MovementSource.Manual,
      appliedQuantity: 1,
      reason: 'Prueba',
      occurredAt,
      stockBefore: 0,
      stockAfter: 1,
    },
  });

  return { id };
}

function trackMovementId(): string {
  const id = randomUUID();
  movementIds.push(id);
  return id;
}
