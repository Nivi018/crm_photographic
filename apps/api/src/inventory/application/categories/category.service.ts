import { randomUUID } from 'node:crypto';
import { InventoryErrorCode } from '@crm-photografy/shared';

import { type CategoryRepository } from '../ports/category-repository.port';
import { type Versioned } from '../ports/repository-types.port';
import { Category } from '../../domain/categories/category';
import { InventoryError } from '../../domain/inventory-error';
import {
  type CategoryListQuery,
  type CategoryPage,
  type CategoryStateCommand,
  type RenameCategoryCommand,
} from './category.contracts';

export class CategoryNameConflictError extends InventoryError {
  constructor() {
    super(
      InventoryErrorCode.NameConflict,
      'a category with the same normalized name already exists',
    );
  }
}

export class CategoryNotFoundError extends InventoryError {
  constructor() {
    super(InventoryErrorCode.NotFound, 'category was not found');
  }
}

export class CategoryService {
  constructor(private readonly categories: CategoryRepository) {}

  async create(name: string): Promise<Versioned<Category>> {
    const category = Category.create({ id: randomUUID(), name });
    await this.assertNameIsAvailable(category);

    return this.categories.save(category);
  }

  async rename(command: RenameCategoryCommand): Promise<Versioned<Category>> {
    const stored = await this.categories.findById(command.id);

    if (!stored) {
      throw new CategoryNotFoundError();
    }

    const category = Category.rehydrate({
      id: stored.entity.id,
      name: stored.entity.name,
      isActive: stored.entity.isActive,
    });
    category.rename(command.name);
    await this.assertNameIsAvailable(category);

    return this.categories.save(category, command.expectedVersion);
  }

  async list(criteria: CategoryListQuery): Promise<CategoryPage> {
    return this.categories.list(criteria);
  }

  async deactivate(command: CategoryStateCommand): Promise<Versioned<Category>> {
    const stored = await this.findCategory(command.id);
    const category = rehydrateCategory(stored.entity);
    const articleCounts = await this.categories.countArticleAssociations(command.id);
    category.deactivate(articleCounts);

    return this.categories.save(category, command.expectedVersion);
  }

  async reactivate(command: CategoryStateCommand): Promise<Versioned<Category>> {
    const stored = await this.findCategory(command.id);
    const category = rehydrateCategory(stored.entity);
    category.reactivate();

    return this.categories.save(category, command.expectedVersion);
  }

  async delete(command: CategoryStateCommand): Promise<void> {
    const stored = await this.findCategory(command.id);
    const articleCounts = await this.categories.countArticleAssociations(command.id);
    stored.entity.assertCanBeDeleted(articleCounts);

    await this.categories.delete(command.id, command.expectedVersion);
  }

  private async assertNameIsAvailable(category: Category): Promise<void> {
    const existing = await this.categories.findByNormalizedName(category.normalizedName);

    if (existing && existing.entity.id !== category.id) {
      throw new CategoryNameConflictError();
    }
  }

  private async findCategory(id: string): Promise<Versioned<Category>> {
    const stored = await this.categories.findById(id);

    if (!stored) {
      throw new CategoryNotFoundError();
    }

    return stored;
  }
}

function rehydrateCategory(category: Category): Category {
  return Category.rehydrate({ id: category.id, name: category.name, isActive: category.isActive });
}
