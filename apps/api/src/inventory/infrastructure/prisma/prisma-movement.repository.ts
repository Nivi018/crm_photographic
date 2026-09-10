import {
  ARTICLE_PAGE_SIZE,
  type AdjustmentMode,
  type MovementKind,
  type MovementSource,
  type PaginatedResponse,
} from '@crm-photografy/shared';

import {
  type MovementListCriteria,
  type MovementRepository,
} from '../../application/ports/movement-repository.port';
import { Movement } from '../../domain/stock/movement';
import { type PrismaClient } from '../../../infrastructure/prisma/generated/client';

export class PrismaMovementRepository implements MovementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async nextSequence(): Promise<bigint> {
    const result = await this.prisma.movement.aggregate({ _max: { sequence: true } });

    return (result._max.sequence ?? 0n) + 1n;
  }

  async append(movement: Movement): Promise<void> {
    await this.prisma.movement.create({
      data: {
        id: movement.id,
        sequence: movement.sequence,
        articleId: movement.articleId,
        kind: movement.kind as never,
        adjustmentMode: movement.adjustmentMode as never,
        source: movement.source as never,
        appliedQuantity: movement.appliedQuantity,
        reason: movement.reason,
        occurredAt: movement.occurredAt,
        stockBefore: movement.stockBefore,
        stockAfter: movement.stockAfter,
      },
    });
  }

  async countByArticleId(articleId: string): Promise<number> {
    return this.prisma.movement.count({ where: { articleId } });
  }

  async list(criteria: MovementListCriteria): Promise<PaginatedResponse<Movement>> {
    const page = Math.max(criteria.page, 1);
    const where = criteria.articleId ? { articleId: criteria.articleId } : {};
    const [records, totalItems] = await Promise.all([
      this.prisma.movement.findMany({
        where,
        orderBy: [
          { occurredAt: 'desc' },
          { article: { normalizedName: 'asc' } },
          { sequence: 'desc' },
        ],
        skip: (page - 1) * ARTICLE_PAGE_SIZE,
        take: ARTICLE_PAGE_SIZE,
      }),
      this.prisma.movement.count({ where }),
    ]);

    return {
      items: records.map(toMovement),
      page,
      pageSize: ARTICLE_PAGE_SIZE,
      totalItems,
      totalPages: Math.ceil(totalItems / ARTICLE_PAGE_SIZE),
    };
  }
}

function toMovement(record: {
  id: string;
  sequence: bigint;
  articleId: string;
  kind: string;
  adjustmentMode: string | null;
  source: string;
  appliedQuantity: number;
  reason: string;
  occurredAt: Date;
  stockBefore: number;
}): Movement {
  return Movement.rehydrate({
    ...record,
    kind: record.kind as MovementKind,
    adjustmentMode: record.adjustmentMode as AdjustmentMode | null,
    source: record.source as MovementSource,
  });
}
