import { ARTICLE_PAGE_SIZE, type PaginatedResponse } from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';

import {
  type CategoryListCriteria,
  type CategoryRepository,
} from '../ports/category-repository.port';
import { type Versioned } from '../ports/repository-types.port';
import { Category } from '../../domain/categories/category';
import {
  ActiveArticleAssociationError,
  CategoryAssociationError,
} from '../../domain/categories/category.errors';
import {
  CategoryNameConflictError,
  CategoryNotFoundError,
  CategoryService,
} from './category.service';

describe('CategoryService', () => {
  it('creates an active category with a generated identifier', async () => {
    const repository = new InMemoryCategoryRepository();
    const service = new CategoryService(repository);

    const created = await service.create('  Iluminacion  ');

    expect(created).toMatchObject({
      version: 0,
      entity: {
        id: expect.any(String),
        name: 'Iluminacion',
        normalizedName: 'iluminacion',
        isActive: true,
      },
    });
  });

  it('rejects creation when an active or inactive category has the normalized name', async () => {
    const repository = new InMemoryCategoryRepository();
    await repository.save(
      Category.rehydrate({ id: 'inactive-category', name: 'Camaras', isActive: false }),
    );
    const service = new CategoryService(repository);

    await expect(service.create('  Ca\u0301maras ')).rejects.toThrow(CategoryNameConflictError);
  });

  it('renames a category using the expected version and allows its current name', async () => {
    const repository = new InMemoryCategoryRepository();
    await repository.save(Category.create({ id: 'category-1', name: 'Fondos' }));
    const service = new CategoryService(repository);

    const updated = await service.rename({
      id: 'category-1',
      name: 'Fondos de estudio',
      expectedVersion: 0,
    });

    expect(updated).toMatchObject({
      version: 1,
      entity: { id: 'category-1', name: 'Fondos de estudio', normalizedName: 'fondos de estudio' },
    });
  });

  it('rejects a rename to another category normalized name', async () => {
    const repository = new InMemoryCategoryRepository();
    await repository.save(Category.create({ id: 'category-1', name: 'Fondos' }));
    await repository.save(Category.create({ id: 'category-2', name: 'Accesorios' }));
    const service = new CategoryService(repository);

    await expect(
      service.rename({ id: 'category-1', name: '  Accesorios ', expectedVersion: 0 }),
    ).rejects.toThrow(CategoryNameConflictError);
  });

  it('returns a typed error when the category to rename does not exist', async () => {
    const service = new CategoryService(new InMemoryCategoryRepository());

    await expect(
      service.rename({ id: 'missing-category', name: 'Fondos', expectedVersion: 0 }),
    ).rejects.toThrow(CategoryNotFoundError);
  });

  it('delegates category listing criteria and pagination to the repository', async () => {
    const repository = new InMemoryCategoryRepository();
    const category = Category.create({ id: 'category-1', name: 'Fondos' });
    await repository.save(category);
    const service = new CategoryService(repository);

    const result = await service.list({ page: 1, isActive: true });

    expect(result).toMatchObject({
      page: 1,
      pageSize: ARTICLE_PAGE_SIZE,
      totalItems: 1,
      totalPages: 1,
    });
    expect(result.items[0]?.entity).toBe(category);
  });

  it('deactivates a category with inactive article associations', async () => {
    const repository = new InMemoryCategoryRepository();
    await repository.save(Category.create({ id: 'category-1', name: 'Fondos' }));
    repository.setArticleCounts('category-1', { active: 0, inactive: 2 });
    const service = new CategoryService(repository);

    const deactivated = await service.deactivate({ id: 'category-1', expectedVersion: 0 });

    expect(deactivated).toMatchObject({ version: 1, entity: { isActive: false } });
  });

  it('blocks deactivation when active articles remain associated', async () => {
    const repository = new InMemoryCategoryRepository();
    await repository.save(Category.create({ id: 'category-1', name: 'Fondos' }));
    repository.setArticleCounts('category-1', { active: 1, inactive: 0 });
    const service = new CategoryService(repository);

    await expect(service.deactivate({ id: 'category-1', expectedVersion: 0 })).rejects.toThrow(
      ActiveArticleAssociationError,
    );
  });

  it('reactivates an inactive category', async () => {
    const repository = new InMemoryCategoryRepository();
    await repository.save(
      Category.rehydrate({ id: 'category-1', name: 'Fondos', isActive: false }),
    );
    const service = new CategoryService(repository);

    const reactivated = await service.reactivate({ id: 'category-1', expectedVersion: 0 });

    expect(reactivated).toMatchObject({ version: 1, entity: { isActive: true } });
  });

  it('deletes a category only when it has no article associations', async () => {
    const repository = new InMemoryCategoryRepository();
    await repository.save(Category.create({ id: 'category-1', name: 'Fondos' }));
    const service = new CategoryService(repository);

    await service.delete({ id: 'category-1', expectedVersion: 0 });

    await expect(repository.findById('category-1')).resolves.toBeNull();
  });

  it('blocks deletion when active or inactive articles remain associated', async () => {
    const repository = new InMemoryCategoryRepository();
    await repository.save(Category.create({ id: 'category-1', name: 'Fondos' }));
    repository.setArticleCounts('category-1', { active: 0, inactive: 1 });
    const service = new CategoryService(repository);

    await expect(service.delete({ id: 'category-1', expectedVersion: 0 })).rejects.toThrow(
      CategoryAssociationError,
    );
  });
});

class InMemoryCategoryRepository implements CategoryRepository {
  private readonly categories = new Map<string, Versioned<Category>>();
  private readonly articleCounts = new Map<string, { active: number; inactive: number }>();

  setArticleCounts(categoryId: string, counts: { active: number; inactive: number }): void {
    this.articleCounts.set(categoryId, counts);
  }

  async findById(id: string): Promise<Versioned<Category> | null> {
    return this.categories.get(id) ?? null;
  }

  async findByNormalizedName(normalizedName: string): Promise<Versioned<Category> | null> {
    return (
      [...this.categories.values()].find(
        ({ entity }) => entity.normalizedName === normalizedName,
      ) ?? null
    );
  }

  async countArticleAssociations(
    categoryId: string,
  ): Promise<{ active: number; inactive: number }> {
    return this.articleCounts.get(categoryId) ?? { active: 0, inactive: 0 };
  }

  async save(category: Category, expectedVersion?: number): Promise<Versioned<Category>> {
    const version = expectedVersion === undefined ? 0 : expectedVersion + 1;
    const saved = { entity: category, version };
    this.categories.set(category.id, saved);

    return saved;
  }

  async delete(id: string): Promise<void> {
    this.categories.delete(id);
  }

  async list(criteria: CategoryListCriteria): Promise<PaginatedResponse<Versioned<Category>>> {
    const items = [...this.categories.values()].filter(
      ({ entity }) => criteria.isActive === undefined || entity.isActive === criteria.isActive,
    );

    return {
      items,
      page: criteria.page,
      pageSize: ARTICLE_PAGE_SIZE,
      totalItems: items.length,
      totalPages: Math.ceil(items.length / ARTICLE_PAGE_SIZE),
    };
  }
}
