import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticleService } from '../application/articles/article.service';
import {
  ArticleStateDto,
  CreateArticleDto,
  ListArticlesDto,
  ReactivateArticleDto,
  UpdateArticleDto,
} from './article.dto';

@ApiTags('inventory-articles')
@Controller('api/inventory/articles')
export class ArticleController {
  constructor(private readonly articles: ArticleService) {}
  @Get() @ApiOperation({ summary: 'List inventory articles' }) list(
    @Query() query: ListArticlesDto,
  ) {
    return this.articles.list(query);
  }
  @Get('low-stock') @ApiOperation({ summary: 'List low-stock articles' }) lowStock(
    @Query() query: ListArticlesDto,
  ) {
    return this.articles.listLowStock({ page: query.page });
  }
  @Get(':id') @ApiOperation({ summary: 'Get an inventory article' }) find(@Param('id') id: string) {
    return this.articles.findById(id);
  }
  @Post() @ApiOperation({ summary: 'Create an inventory article' }) create(
    @Body() body: CreateArticleDto,
  ) {
    return this.articles.create(body);
  }
  @Patch(':id') @ApiOperation({ summary: 'Edit an inventory article' }) update(
    @Param('id') id: string,
    @Body() body: UpdateArticleDto,
  ) {
    return this.articles.edit({ ...body, id });
  }
  @Post(':id/deactivate') @ApiOperation({ summary: 'Deactivate an inventory article' }) deactivate(
    @Param('id') id: string,
    @Body() body: ArticleStateDto,
  ) {
    return this.articles.deactivate({ ...body, id });
  }
  @Post(':id/reactivate') @ApiOperation({ summary: 'Reactivate an inventory article' }) reactivate(
    @Param('id') id: string,
    @Body() body: ReactivateArticleDto,
  ) {
    return this.articles.reactivate({ ...body, id });
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete an inventory article' }) remove(
    @Param('id') id: string,
    @Body() body: ArticleStateDto,
  ) {
    return this.articles.delete({ ...body, id });
  }
}
