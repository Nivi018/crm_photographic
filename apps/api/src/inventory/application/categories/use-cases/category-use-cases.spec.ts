import { describe, expect, it, vi } from 'vitest';

import { CategoryService } from '../category.service';
import { CreateCategoryUseCase } from './create-category.use-case';
import { DeactivateCategoryUseCase } from './deactivate-category.use-case';
import { DeleteCategoryUseCase } from './delete-category.use-case';
import { ListCategoriesUseCase } from './list-categories.use-case';
import { ReactivateCategoryUseCase } from './reactivate-category.use-case';
import { RenameCategoryUseCase } from './rename-category.use-case';

describe('category use cases', () => {
  it('delegates each category operation through its own executable module', async () => {
    const methods = {
      create: vi.fn().mockResolvedValue('created'),
      list: vi.fn().mockResolvedValue('listed'),
      rename: vi.fn().mockResolvedValue('renamed'),
      deactivate: vi.fn().mockResolvedValue('deactivated'),
      reactivate: vi.fn().mockResolvedValue('reactivated'),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const service = methods as unknown as CategoryService;

    await expect(new CreateCategoryUseCase(service).execute({ name: 'Fondos' })).resolves.toBe(
      'created',
    );
    await expect(new ListCategoriesUseCase(service).execute({ page: 1 })).resolves.toBe('listed');
    await expect(new RenameCategoryUseCase(service).execute({} as never)).resolves.toBe('renamed');
    await expect(new DeactivateCategoryUseCase(service).execute({} as never)).resolves.toBe(
      'deactivated',
    );
    await expect(new ReactivateCategoryUseCase(service).execute({} as never)).resolves.toBe(
      'reactivated',
    );
    await expect(new DeleteCategoryUseCase(service).execute({} as never)).resolves.toBeUndefined();

    expect(methods.create).toHaveBeenCalledOnce();
    expect(methods.list).toHaveBeenCalledOnce();
    expect(methods.rename).toHaveBeenCalledOnce();
    expect(methods.deactivate).toHaveBeenCalledOnce();
    expect(methods.reactivate).toHaveBeenCalledOnce();
    expect(methods.delete).toHaveBeenCalledOnce();
  });
});
