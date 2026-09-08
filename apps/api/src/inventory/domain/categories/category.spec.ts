import { INVENTORY_LIMITS } from '@crm-photografy/shared';
import { describe, expect, it } from 'vitest';

import { RequiredTextError } from '../text/normalization';
import {
  ActiveArticleAssociationError,
  Category,
  CategoryAssociationError,
  CategoryNameTooLongError,
} from './category';

describe('Category', () => {
  it('creates an active category with trimmed and normalized names', () => {
    const category = Category.create({ id: 'category-1', name: '  Iluminacio\u0301n  ' });

    expect(category.name).toBe('Iluminacio\u0301n');
    expect(category.normalizedName).toBe('iluminacion');
    expect(category.isActive).toBe(true);
  });

  it('rejects an empty or overlong category name', () => {
    expect(() => Category.create({ id: 'category-1', name: ' \t ' })).toThrow(RequiredTextError);
    expect(() =>
      Category.create({
        id: 'category-1',
        name: 'a'.repeat(INVENTORY_LIMITS.maximumCategoryNameLength + 1),
      }),
    ).toThrow(CategoryNameTooLongError);
  });

  it('updates the displayed and normalized name when renamed', () => {
    const category = Category.create({ id: 'category-1', name: 'Iluminacion' });

    category.rename('  Ca\u0301maras  ');

    expect(category.name).toBe('Ca\u0301maras');
    expect(category.normalizedName).toBe('camaras');
  });

  it('deactivates a category when it has only inactive associated articles', () => {
    const category = Category.create({ id: 'category-1', name: 'Iluminacion' });

    category.deactivate({ active: 0, inactive: 2 });

    expect(category.isActive).toBe(false);
  });

  it('does not deactivate a category with active associated articles', () => {
    const category = Category.create({ id: 'category-1', name: 'Iluminacion' });

    expect(() => category.deactivate({ active: 1, inactive: 0 })).toThrow(
      ActiveArticleAssociationError,
    );
    expect(category.isActive).toBe(true);
  });

  it('reactivates an inactive category', () => {
    const category = Category.rehydrate({ id: 'category-1', name: 'Iluminacion', isActive: false });

    category.reactivate();

    expect(category.isActive).toBe(true);
  });

  it('allows deletion only without active or inactive associated articles', () => {
    const category = Category.create({ id: 'category-1', name: 'Iluminacion' });

    expect(() => category.assertCanBeDeleted({ active: 0, inactive: 0 })).not.toThrow();
    expect(() => category.assertCanBeDeleted({ active: 0, inactive: 1 })).toThrow(
      CategoryAssociationError,
    );
    expect(() => category.assertCanBeDeleted({ active: 1, inactive: 0 })).toThrow(
      CategoryAssociationError,
    );
  });
});
