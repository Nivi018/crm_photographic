import { PrismaPg } from '@prisma/adapter-pg';

import {
  type InventoryRepositories,
  type InventoryUnitOfWork,
} from '../../application/ports/inventory-unit-of-work.port';
import { PrismaClient } from '../../../infrastructure/prisma/generated/client';
import { PrismaInventoryUnitOfWork } from './prisma-inventory.unit-of-work';

export class LazyInventoryUnitOfWork implements InventoryUnitOfWork {
  private unitOfWorkValue: PrismaInventoryUnitOfWork | undefined;

  async execute<T>(operation: (repositories: InventoryRepositories) => Promise<T>): Promise<T> {
    return this.unitOfWork().execute(operation);
  }

  private unitOfWork(): PrismaInventoryUnitOfWork {
    if (!this.unitOfWorkValue) {
      const connectionString = process.env.DATABASE_URL;

      if (!connectionString) throw new Error('DATABASE_URL is required to access inventory data');

      this.unitOfWorkValue = new PrismaInventoryUnitOfWork(
        new PrismaClient({ adapter: new PrismaPg({ connectionString }) }),
      );
    }

    return this.unitOfWorkValue;
  }
}
