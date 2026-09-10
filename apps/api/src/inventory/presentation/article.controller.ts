import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticleService } from '../application/articles/article.service';
import {
  ArticleStateDto,
  ArticleIdParamDto,
  type ArticlePageResponseDto,
  type ArticleResponseDto,
  CreateArticleDto,
  ListArticlesDto,
  ReactivateArticleDto,
  UpdateArticleDto,
} from './article.dto';
import { ArticleNotFoundError } from '../application/articles/article.service';
import { toArticleResponse, toPaginatedResponse, toResponse } from './inventory.mapper';
import type { ApiResponse, DeleteResponse } from '@crm-photografy/shared';

@ApiTags('inventory-articles')
@Controller('api/inventory/articles')
export class ArticleController {
  constructor(private readonly articles: ArticleService) {}
  @Get() @ApiOperation({ summary: 'List inventory articles' }) list(
    @Query() query: ListArticlesDto,
  ): Promise<ArticlePageResponseDto> {
    return this.articles.list(query).then((page) => toPaginatedResponse(page, toArticleResponse));
  }
  @Get('low-stock') @ApiOperation({ summary: 'List low-stock articles' }) lowStock(
    @Query() query: ListArticlesDto,
  ): Promise<ArticlePageResponseDto> {
    return this.articles
      .listLowStock({ page: query.page })
      .then((page) => toPaginatedResponse(page, toArticleResponse));
  }
  @Get(':id') @ApiOperation({ summary: 'Get an inventory article' }) async find(
    @Param() params: ArticleIdParamDto,
  ): Promise<ArticleResponseDto> {
    const article = await this.articles.findById(params.id);

    if (!article) throw new ArticleNotFoundError();

    return toResponse(toArticleResponse(article));
  }
  @Post() @ApiOperation({ summary: 'Create an inventory article' }) create(
    @Body() body: CreateArticleDto,
  ): Promise<ArticleResponseDto> {
    return this.articles.create(body).then((article) => toResponse(toArticleResponse(article)));
  }
  @Patch(':id') @ApiOperation({ summary: 'Edit an inventory article' }) update(
    @Param() params: ArticleIdParamDto,
    @Body() body: UpdateArticleDto,
  ): Promise<ArticleResponseDto> {
    return this.articles
      .edit({ ...body, id: params.id })
      .then((article) => toResponse(toArticleResponse(article)));
  }
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate an inventory article' })
  deactivate(
    @Param() params: ArticleIdParamDto,
    @Body() body: ArticleStateDto,
  ): Promise<ArticleResponseDto> {
    return this.articles
      .deactivate({ ...body, id: params.id })
      .then((article) => toResponse(toArticleResponse(article)));
  }
  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate an inventory article' })
  reactivate(
    @Param() params: ArticleIdParamDto,
    @Body() body: ReactivateArticleDto,
  ): Promise<ArticleResponseDto> {
    return this.articles
      .reactivate({ ...body, id: params.id })
      .then((article) => toResponse(toArticleResponse(article)));
  }
  @Delete(':id') @ApiOperation({ summary: 'Delete an inventory article' }) remove(
    @Param() params: ArticleIdParamDto,
    @Body() body: ArticleStateDto,
  ): Promise<ApiResponse<DeleteResponse>> {
    return this.articles
      .delete({ ...body, id: params.id })
      .then(() => toResponse({ id: params.id }));
  }
}
