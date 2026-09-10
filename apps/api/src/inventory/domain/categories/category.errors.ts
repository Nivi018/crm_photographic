import { INVENTORY_LIMITS } from '@crm-photografy/shared';

export class CategoryNameTooLongError extends Error {
  constructor() {
    super(`category name cannot exceed ${INVENTORY_LIMITS.maximumCategoryNameLength} characters`);
    this.name = 'CategoryNameTooLongError';
  }
}

export class ActiveArticleAssociationError extends Error {
  constructor() {
    super('category with active articles cannot be deactivated');
    this.name = 'ActiveArticleAssociationError';
  }
}

export class CategoryAssociationError extends Error {
  constructor() {
    super('category with associated articles cannot be deleted');
    this.name = 'CategoryAssociationError';
  }
}

export class InvalidArticleAssociationCountError extends Error {
  constructor() {
    super('article association counts must be non-negative integers');
    this.name = 'InvalidArticleAssociationCountError';
  }
}
