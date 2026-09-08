import { ArticleType, INVENTORY_LIMITS } from '@crm-photografy/shared';

import { validateInitialStock, validateMinimumStock, validateStock } from '../stock/quantities';
import { normalizeName, trimRequiredText } from '../text/normalization';

export interface ArticleCategory {
  id: string;
  isActive: boolean;
}

export interface ArticleCreateProperties {
  id: string;
  name: string;
  type: ArticleType;
  category: ArticleCategory;
  initialStock: number;
  minimumStock: number;
}

export interface ArticleEditProperties {
  name: string;
  type: ArticleType;
  category: ArticleCategory;
  initialStock: number;
  minimumStock: number;
}

export interface ArticleProperties {
  id: string;
  name: string;
  type: ArticleType;
  categoryId: string;
  initialStock: number;
  currentStock: number;
  minimumStock: number;
  isActive: boolean;
}

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

export class Article {
  readonly id: string;
  name: string;
  normalizedName: string;
  type: ArticleType;
  categoryId: string;
  initialStock: number;
  currentStock: number;
  minimumStock: number;
  isActive: boolean;

  private constructor(properties: ArticleProperties) {
    const name = prepareName(properties.name);

    validateArticleType(properties.type);
    validateInitialStock(properties.initialStock);
    validateStock(properties.currentStock);
    validateMinimumStock(properties.minimumStock);

    this.id = properties.id;
    this.name = name.visible;
    this.normalizedName = name.normalized;
    this.type = properties.type;
    this.categoryId = properties.categoryId;
    this.initialStock = properties.initialStock;
    this.currentStock = properties.currentStock;
    this.minimumStock = properties.minimumStock;
    this.isActive = properties.isActive;
  }

  static create(properties: ArticleCreateProperties): Article {
    validateActiveCategory(properties.category);

    return new Article({
      id: properties.id,
      name: properties.name,
      type: properties.type,
      categoryId: properties.category.id,
      initialStock: properties.initialStock,
      currentStock: 0,
      minimumStock: properties.minimumStock,
      isActive: true,
    });
  }

  static rehydrate(properties: ArticleProperties): Article {
    return new Article(properties);
  }

  get hasLowStock(): boolean {
    return this.isActive && this.currentStock <= this.minimumStock;
  }

  edit(properties: ArticleEditProperties): void {
    this.assertIsActive();
    validateActiveCategory(properties.category);

    const name = prepareName(properties.name);
    validateArticleType(properties.type);
    validateInitialStock(properties.initialStock);
    validateMinimumStock(properties.minimumStock);

    this.name = name.visible;
    this.normalizedName = name.normalized;
    this.type = properties.type;
    this.categoryId = properties.category.id;
    this.initialStock = properties.initialStock;
    this.minimumStock = properties.minimumStock;
  }

  deactivate(): void {
    this.isActive = false;
  }

  reactivate(category: ArticleCategory): void {
    validateActiveCategory(category);

    this.categoryId = category.id;
    this.isActive = true;
  }

  assertCanReceiveMovement(): void {
    this.assertIsActive();
  }

  assertCanBeDeleted(movementCount: number): void {
    if (!Number.isInteger(movementCount) || movementCount < 0) {
      throw new InvalidMovementCountError();
    }

    if (movementCount > 0) {
      throw new ArticleHasMovementsError();
    }

    if (this.currentStock !== 0) {
      throw new ArticleStockNotZeroError();
    }
  }

  private assertIsActive(): void {
    if (!this.isActive) {
      throw new ArticleInactiveError();
    }
  }
}

function prepareName(value: string): { visible: string; normalized: string } {
  const visible = trimRequiredText(value, 'name');

  if (visible.length > INVENTORY_LIMITS.maximumArticleNameLength) {
    throw new ArticleNameTooLongError();
  }

  return { visible, normalized: normalizeName(visible) };
}

function validateArticleType(value: ArticleType): void {
  if (value !== ArticleType.Sale && value !== ArticleType.InternalSupply) {
    throw new InvalidArticleTypeError();
  }
}

function validateActiveCategory(category: ArticleCategory): void {
  if (!category.id.trim() || !category.isActive) {
    throw new CategoryInactiveError();
  }
}
