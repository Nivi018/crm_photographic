import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticleService } from '../application/articles/article.service';
import {
  DeltaAdjustmentDto,
  FinalStockAdjustmentDto,
  ArticleIdParamDto,
  MovementDto,
  MovementListDto,
  type MovementPageResponseDto,
  type MovementResponseDto,
} from './movement.dto';
import {
  toMovementOperationResponse,
  toMovementResponse,
  toPaginatedResponse,
} from './inventory.mapper';

@ApiTags('inventory-movements')
@Controller('api/inventory')
export class MovementController {
  constructor(private readonly articles: ArticleService) {}
  @Get('movements') @ApiOperation({ summary: 'List inventory movements' }) list(
    @Query() query: MovementListDto,
  ): Promise<MovementPageResponseDto> {
    return this.articles
      .listMovements(query)
      .then((page) => toPaginatedResponse(page, toMovementResponse));
  }
  @Get('articles/:id/movements') @ApiOperation({ summary: 'List article movements' }) listByArticle(
    @Param() params: ArticleIdParamDto,
    @Query() query: MovementListDto,
  ): Promise<MovementPageResponseDto> {
    return this.articles
      .listArticleMovements(params.id, query)
      .then((page) => toPaginatedResponse(page, toMovementResponse));
  }
  @Post('articles/:id/movements/entries') @ApiOperation({ summary: 'Register an entry' }) entry(
    @Param() params: ArticleIdParamDto,
    @Body() body: MovementDto,
  ): Promise<MovementResponseDto> {
    return this.articles
      .registerEntry({ ...body, articleId: params.id })
      .then(toMovementOperationResponse);
  }
  @Post('articles/:id/movements/exits') @ApiOperation({ summary: 'Register an exit' }) exit(
    @Param() params: ArticleIdParamDto,
    @Body() body: MovementDto,
  ): Promise<MovementResponseDto> {
    return this.articles
      .registerExit({ ...body, articleId: params.id })
      .then(toMovementOperationResponse);
  }
  @Post('articles/:id/movements/final-stock-adjustments')
  @ApiOperation({ summary: 'Adjust to final stock' })
  finalStock(
    @Param() params: ArticleIdParamDto,
    @Body() body: FinalStockAdjustmentDto,
  ): Promise<MovementResponseDto> {
    return this.articles
      .registerFinalStockAdjustment({ ...body, articleId: params.id })
      .then(toMovementOperationResponse);
  }
  @Post('articles/:id/movements/delta-adjustments')
  @ApiOperation({ summary: 'Adjust stock by difference' })
  delta(
    @Param() params: ArticleIdParamDto,
    @Body() body: DeltaAdjustmentDto,
  ): Promise<MovementResponseDto> {
    return this.articles
      .registerDeltaAdjustment({ ...body, articleId: params.id })
      .then(toMovementOperationResponse);
  }
}
