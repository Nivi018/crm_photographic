import { type PaginatedResponse } from '@crm-photografy/shared';

import { type Movement } from '../../domain/stock/movement';
import { type PageRequest } from './repository-types.port';

export interface MovementListCriteria extends PageRequest {
  articleId?: string;
}

export interface MovementRepository {
  nextSequence(): Promise<bigint>;
  append(movement: Movement): Promise<void>;
  countByArticleId(articleId: string): Promise<number>;
  list(criteria: MovementListCriteria): Promise<PaginatedResponse<Movement>>;
}
