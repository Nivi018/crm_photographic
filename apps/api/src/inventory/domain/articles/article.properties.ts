import { type ArticleType } from '@crm-photografy/shared';

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
