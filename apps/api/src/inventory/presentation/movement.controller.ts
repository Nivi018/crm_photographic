import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { MovementPageResponseEnvelopeDto, MovementResponseEnvelopeDto } from './api-response.dto';
import { ApiInventoryErrorResponses } from './api-response.decorators';

@ApiTags('inventory-movements')
@Controller('api/inventory')
export class MovementController {
  constructor(private readonly articles: ArticleService) {}
  @Get('movements')
  @ApiOperation({ summary: 'List inventory movements' })
  @ApiOkResponse({ type: MovementPageResponseEnvelopeDto })
  @ApiInventoryErrorResponses({ badRequest: 'Invalid movement list query.' })
  list(@Query() query: MovementListDto): Promise<MovementPageResponseDto> {
    return this.articles
      .listMovements(query)
      .then((page) => toPaginatedResponse(page, toMovementResponse));
  }
  @Get('articles/:id/movements')
  @ApiOperation({ summary: 'List article movements' })
  @ApiOkResponse({ type: MovementPageResponseEnvelopeDto })
  @ApiInventoryErrorResponses({
    badRequest: 'Invalid article identifier or movement list query.',
    notFound: 'Article was not found.',
  })
  listByArticle(
    @Param() params: ArticleIdParamDto,
    @Query() query: MovementListDto,
  ): Promise<MovementPageResponseDto> {
    return this.articles
      .listArticleMovements(params.id, query)
      .then((page) => toPaginatedResponse(page, toMovementResponse));
  }
  @Post('articles/:id/movements/entries')
  @ApiOperation({ summary: 'Register an entry' })
  @ApiCreatedResponse({ type: MovementResponseEnvelopeDto })
  @ApiInventoryErrorResponses({
    badRequest: 'Invalid movement data, inactive article, or stock range.',
    conflict: 'Article was concurrently modified.',
    notFound: 'Article was not found.',
  })
  entry(
    @Param() params: ArticleIdParamDto,
    @Body() body: MovementDto,
  ): Promise<MovementResponseDto> {
    return this.articles
      .registerEntry({ ...body, articleId: params.id })
      .then(toMovementOperationResponse);
  }
  @Post('articles/:id/movements/exits')
  @ApiOperation({ summary: 'Register an exit' })
  @ApiCreatedResponse({ type: MovementResponseEnvelopeDto })
  @ApiInventoryErrorResponses({
    badRequest: 'Invalid movement data, inactive article, or stock range.',
    conflict: 'Article was concurrently modified.',
    negativeStockConfirmation: true,
    notFound: 'Article was not found.',
  })
  exit(
    @Param() params: ArticleIdParamDto,
    @Body() body: MovementDto,
  ): Promise<MovementResponseDto> {
    return this.articles
      .registerExit({ ...body, articleId: params.id })
      .then(toMovementOperationResponse);
  }
  @Post('articles/:id/movements/final-stock-adjustments')
  @ApiOperation({ summary: 'Adjust to final stock' })
  @ApiCreatedResponse({ type: MovementResponseEnvelopeDto })
  @ApiInventoryErrorResponses({
    badRequest: 'Invalid adjustment data, inactive article, no stock difference, or stock range.',
    conflict: 'Article was concurrently modified.',
    notFound: 'Article was not found.',
  })
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
  @ApiCreatedResponse({ type: MovementResponseEnvelopeDto })
  @ApiInventoryErrorResponses({
    badRequest: 'Invalid adjustment data, inactive article, or stock range.',
    conflict: 'Article was concurrently modified.',
    negativeStockConfirmation: true,
    notFound: 'Article was not found.',
  })
  delta(
    @Param() params: ArticleIdParamDto,
    @Body() body: DeltaAdjustmentDto,
  ): Promise<MovementResponseDto> {
    return this.articles
      .registerDeltaAdjustment({ ...body, articleId: params.id })
      .then(toMovementOperationResponse);
  }
}
