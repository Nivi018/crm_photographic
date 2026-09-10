import { INVENTORY_LIMITS } from '@crm-photografy/shared';

import {
  ActiveArticleAssociationError,
  CategoryAssociationError,
  CategoryNameTooLongError,
  InvalidArticleAssociationCountError,
} from './category.errors';
import {
  type CategoryArticleCounts,
  type CategoryCreateProperties,
  type CategoryProperties,
} from './category.properties';
import { normalizeName, trimRequiredText } from '../text/normalization';

export class Category {
  readonly id: string;
  name: string;
  normalizedName: string;
  isActive: boolean;

  private constructor(properties: CategoryProperties) {
    const name = prepareName(properties.name);

    this.id = properties.id;
    this.name = name.visible;
    this.normalizedName = name.normalized;
    this.isActive = properties.isActive;
  }

  static create(properties: CategoryCreateProperties): Category {
    return new Category({ ...properties, isActive: true });
  }

  static rehydrate(properties: CategoryProperties): Category {
    return new Category(properties);
  }

  rename(name: string): void {
    const nextName = prepareName(name);

    this.name = nextName.visible;
    this.normalizedName = nextName.normalized;
  }

  deactivate(articleCounts: CategoryArticleCounts): void {
    validateArticleCounts(articleCounts);

    if (articleCounts.active > 0) {
      throw new ActiveArticleAssociationError();
    }

    this.isActive = false;
  }

  reactivate(): void {
    this.isActive = true;
  }

  assertCanBeDeleted(articleCounts: CategoryArticleCounts): void {
    validateArticleCounts(articleCounts);

    if (articleCounts.active > 0 || articleCounts.inactive > 0) {
      throw new CategoryAssociationError();
    }
  }
}

function prepareName(value: string): { visible: string; normalized: string } {
  const visible = trimRequiredText(value, 'name');

  if (visible.length > INVENTORY_LIMITS.maximumCategoryNameLength) {
    throw new CategoryNameTooLongError();
  }

  return { visible, normalized: normalizeName(visible) };
}

function validateArticleCounts(articleCounts: CategoryArticleCounts): void {
  if (!Number.isInteger(articleCounts.active) || articleCounts.active < 0) {
    throw new InvalidArticleAssociationCountError();
  }

  if (!Number.isInteger(articleCounts.inactive) || articleCounts.inactive < 0) {
    throw new InvalidArticleAssociationCountError();
  }
}
