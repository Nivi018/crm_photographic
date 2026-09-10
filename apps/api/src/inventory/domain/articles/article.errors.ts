import { INVENTORY_LIMITS } from '@crm-photografy/shared';

export class ArticleNameTooLongError extends Error {
  constructor() {
    super(`article name cannot exceed ${INVENTORY_LIMITS.maximumArticleNameLength} characters`);
    this.name = 'ArticleNameTooLongError';
  }
}

export class InvalidArticleTypeError extends Error {
  constructor() {
    super('article type is invalid');
    this.name = 'InvalidArticleTypeError';
  }
}

export class CategoryInactiveError extends Error {
  constructor() {
    super('article category must be active');
    this.name = 'CategoryInactiveError';
  }
}

export class ArticleInactiveError extends Error {
  constructor() {
    super('inactive article cannot be modified or receive movements');
    this.name = 'ArticleInactiveError';
  }
}

export class ArticleHasMovementsError extends Error {
  constructor() {
    super('article with movements cannot be deleted');
    this.name = 'ArticleHasMovementsError';
  }
}

export class ArticleStockNotZeroError extends Error {
  constructor() {
    super('article with non-zero current stock cannot be deleted');
    this.name = 'ArticleStockNotZeroError';
  }
}

export class InvalidMovementCountError extends Error {
  constructor() {
    super('movement count must be a non-negative integer');
    this.name = 'InvalidMovementCountError';
  }
}
