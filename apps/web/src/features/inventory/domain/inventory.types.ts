import { ArticleType } from '@crm-photografy/shared';

export interface ArticleFormValues {
  categoryId: string;
  initialStock: string;
  minimumStock: string;
  name: string;
  type: ArticleType | '';
}

export type ArticleFormErrors = Partial<Record<keyof ArticleFormValues, string>>;

export interface ArticleSnapshot {
  categoryId: string;
  currentStock: number;
  id: string;
  initialStock: number;
  isActive: boolean;
  minimumStock: number;
  name: string;
  type: ArticleType;
  version: number;
}

export interface CategorySnapshot {
  id: string;
  isActive: boolean;
  name: string;
  version: number;
}

export interface ArticleMutationInput {
  categoryId: string;
  initialStock: number;
  minimumStock: number;
  name: string;
  type: ArticleType;
}

export interface UpdateArticleMutationInput extends ArticleMutationInput {
  expectedVersion: number;
}

export interface UpdateCategoryMutationInput {
  expectedVersion: number;
  name: string;
}
