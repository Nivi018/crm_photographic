import {
  type InventoryRepositories,
  type InventoryUnitOfWork,
} from '../../application/ports/inventory-ports';
import { type PrismaClient } from '../../../infrastructure/prisma/generated/client';
import { PrismaArticleRepository } from './prisma-article.repository';
import { PrismaCategoryRepository } from './prisma-category.repository';
import { PrismaMovementRepository } from './prisma-movement.repository';

export class PrismaInventoryUnitOfWork implements InventoryUnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(operation: (repositories: InventoryRepositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (transaction) =>
      operation({
        categories: new PrismaCategoryRepository(transaction as PrismaClient),
        articles: new PrismaArticleRepository(transaction as PrismaClient),
        movements: new PrismaMovementRepository(transaction as PrismaClient),
      }),
    );
  }
}
