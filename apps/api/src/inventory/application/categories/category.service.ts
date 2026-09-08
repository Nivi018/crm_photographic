import { randomUUID } from 'node:crypto';

import {
  type CategoryListCriteria,
  type CategoryRepository,
  type Versioned,
} from '../ports/inventory-ports';
import { Category } from '../../domain/categories/category';
import { type PaginatedResponse } from '@crm-photografy/shared';

export interface RenameCategoryCommand {
  id: string;
  name: string;
  expectedVersion: number;
}

export interface CategoryStateCommand {
  id: string;
  expectedVersion: number;
}

export class CategoryNameConflictError extends Error {
  constructor() {
    super('a category with the same normalized name already exists');
    this.name = 'CategoryNameConflictError';
  }
}

export class CategoryNotFoundError extends Error {
  constructor() {
    super('category was not found');
    this.name = 'CategoryNotFoundError';
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

  async list(criteria: CategoryListCriteria): Promise<PaginatedResponse<Versioned<Category>>> {
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
