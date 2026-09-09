import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticleService } from '../application/articles/article.service';
import {
  DeltaAdjustmentDto,
  FinalStockAdjustmentDto,
  MovementDto,
  MovementListDto,
} from './movement.dto';

@ApiTags('inventory-movements')
@Controller('api/inventory')
export class MovementController {
  constructor(private readonly articles: ArticleService) {}
  @Get('movements') @ApiOperation({ summary: 'List inventory movements' }) list(
    @Query() query: MovementListDto,
  ) {
    return this.articles.listMovements(query);
  }
  @Get('articles/:id/movements') @ApiOperation({ summary: 'List article movements' }) listByArticle(
    @Param('id') id: string,
    @Query() query: MovementListDto,
  ) {
    return this.articles.listArticleMovements(id, query);
  }
  @Post('articles/:id/movements/entries') @ApiOperation({ summary: 'Register an entry' }) entry(
    @Param('id') articleId: string,
    @Body() body: MovementDto,
  ) {
    return this.articles.registerEntry({ ...body, articleId });
  }
  @Post('articles/:id/movements/exits') @ApiOperation({ summary: 'Register an exit' }) exit(
    @Param('id') articleId: string,
    @Body() body: MovementDto,
  ) {
    return this.articles.registerExit({ ...body, articleId });
  }
  @Post('articles/:id/movements/final-stock-adjustments')
  @ApiOperation({ summary: 'Adjust to final stock' })
  finalStock(@Param('id') articleId: string, @Body() body: FinalStockAdjustmentDto) {
    return this.articles.registerFinalStockAdjustment({ ...body, articleId });
  }
  @Post('articles/:id/movements/delta-adjustments')
  @ApiOperation({ summary: 'Adjust stock by difference' })
  delta(@Param('id') articleId: string, @Body() body: DeltaAdjustmentDto) {
    return this.articles.registerDeltaAdjustment({ ...body, articleId });
  }
}
