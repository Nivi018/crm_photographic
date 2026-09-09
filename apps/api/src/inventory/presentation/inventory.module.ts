import { Module } from '@nestjs/common';

import { CategoryService } from '../application/categories/category.service';
import { LazyCategoryRepository } from '../infrastructure/prisma/lazy-category.repository';
import { CategoryController } from './category.controller';

@Module({
  controllers: [CategoryController],
  providers: [
    LazyCategoryRepository,
    {
      provide: CategoryService,
      inject: [LazyCategoryRepository],
      useFactory: (categories: LazyCategoryRepository) => new CategoryService(categories),
    },
  ],
})
export class InventoryModule {}
