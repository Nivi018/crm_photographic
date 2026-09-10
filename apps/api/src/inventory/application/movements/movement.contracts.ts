import { type PaginatedResponse } from '@crm-photografy/shared';

import { type Article } from '../../domain/articles/article';
import { type Movement } from '../../domain/stock/movement';
import { type Versioned } from '../ports/repository-types.port';

export interface ListMovementsQuery {
  page: number;
}

export interface ListArticleMovementsQuery extends ListMovementsQuery {
  articleId: string;
}

export interface RegisterEntryCommand {
  articleId: string;
  quantity: number;
  reason: string;
  expectedVersion: number;
}

export interface RegisterExitCommand extends RegisterEntryCommand {
  confirmNegativeStock?: boolean;
}

export interface RegisterFinalStockAdjustmentCommand {
  articleId: string;
  finalStock: number;
  expectedVersion: number;
}

export interface RegisterDeltaAdjustmentCommand extends RegisterEntryCommand {
  confirmNegativeStock?: boolean;
}

export type MovementPage = PaginatedResponse<Movement>;
export type MovementResult = Versioned<Article>;
