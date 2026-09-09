import { Module } from '@nestjs/common';

import { CategoryService } from '../application/categories/category.service';
import { ArticleService } from '../application/articles/article.service';
import { LazyCategoryRepository } from '../infrastructure/prisma/lazy-category.repository';
import { LazyInventoryUnitOfWork } from '../infrastructure/prisma/lazy-inventory.unit-of-work';
import { ArticleController } from './article.controller';
import { MovementController } from './movement.controller';
import { CategoryController } from './category.controller';

@Module({
  controllers: [CategoryController, ArticleController, MovementController],
  providers: [
    LazyCategoryRepository,
    LazyInventoryUnitOfWork,
    {
      provide: CategoryService,
      inject: [LazyCategoryRepository],
      useFactory: (categories: LazyCategoryRepository) => new CategoryService(categories),
    },
    {
      provide: ArticleService,
      inject: [LazyInventoryUnitOfWork],
      useFactory: (unitOfWork: LazyInventoryUnitOfWork) => new ArticleService(unitOfWork),
    },
  ],
})
export class InventoryModule {}
