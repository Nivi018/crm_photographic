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
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import {
  ArticlePageResponseEnvelopeDto,
  ArticleResponseEnvelopeDto,
  DeleteResponseEnvelopeDto,
} from './api-response.dto';
import { ApiInventoryErrorResponses } from './api-response.decorators';

@ApiTags('inventory-articles')
@Controller('api/inventory/articles')
export class ArticleController {
  constructor(private readonly articles: ArticleService) {}
  @Get()
  @ApiOperation({ summary: 'List inventory articles' })
  @ApiOkResponse({ type: ArticlePageResponseEnvelopeDto })
  @ApiInventoryErrorResponses({ badRequest: 'Invalid article list query.' })
  list(@Query() query: ListArticlesDto): Promise<ArticlePageResponseDto> {
    return this.articles.list(query).then((page) => toPaginatedResponse(page, toArticleResponse));
  }
  @Get('low-stock')
  @ApiOperation({ summary: 'List low-stock articles' })
  @ApiOkResponse({ type: ArticlePageResponseEnvelopeDto })
  @ApiInventoryErrorResponses({ badRequest: 'Invalid low-stock list query.' })
  lowStock(@Query() query: ListArticlesDto): Promise<ArticlePageResponseDto> {
    return this.articles
      .listLowStock({ page: query.page })
      .then((page) => toPaginatedResponse(page, toArticleResponse));
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get an inventory article' })
  @ApiOkResponse({ type: ArticleResponseEnvelopeDto })
  @ApiInventoryErrorResponses({
    badRequest: 'Invalid article identifier.',
    notFound: 'Article was not found.',
  })
  async find(@Param() params: ArticleIdParamDto): Promise<ArticleResponseDto> {
    const article = await this.articles.findById(params.id);

    if (!article) throw new ArticleNotFoundError();

    return toResponse(toArticleResponse(article));
  }
  @Post()
  @ApiOperation({ summary: 'Create an inventory article' })
  @ApiCreatedResponse({ type: ArticleResponseEnvelopeDto })
  @ApiInventoryErrorResponses({
    badRequest: 'Invalid article data or inactive category.',
    conflict: 'Article name already exists.',
    notFound: 'Category was not found.',
  })
  create(@Body() body: CreateArticleDto): Promise<ArticleResponseDto> {
    return this.articles.create(body).then((article) => toResponse(toArticleResponse(article)));
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Edit an inventory article' })
  @ApiOkResponse({ type: ArticleResponseEnvelopeDto })
  @ApiInventoryErrorResponses({
    badRequest: 'Invalid article data, inactive article/category, or stock range.',
    conflict: 'Article name already exists or was concurrently modified.',
    negativeStockConfirmation: true,
    notFound: 'Article or category was not found.',
  })
  update(
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
  @ApiOkResponse({ type: ArticleResponseEnvelopeDto })
  @ApiInventoryErrorResponses({
    badRequest: 'Invalid article state request.',
    conflict: 'Article was concurrently modified.',
    notFound: 'Article was not found.',
  })
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
  @ApiOkResponse({ type: ArticleResponseEnvelopeDto })
  @ApiInventoryErrorResponses({
    badRequest: 'Invalid article state request or inactive category.',
    conflict: 'Article was concurrently modified.',
    notFound: 'Article or category was not found.',
  })
  reactivate(
    @Param() params: ArticleIdParamDto,
    @Body() body: ReactivateArticleDto,
  ): Promise<ArticleResponseDto> {
    return this.articles
      .reactivate({ ...body, id: params.id })
      .then((article) => toResponse(toArticleResponse(article)));
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an inventory article' })
  @ApiOkResponse({ type: DeleteResponseEnvelopeDto })
  @ApiInventoryErrorResponses({
    badRequest: 'Invalid article state request.',
    conflict: 'Article has stock or movements, or was concurrently modified.',
    notFound: 'Article was not found.',
  })
  remove(
    @Param() params: ArticleIdParamDto,
    @Body() body: ArticleStateDto,
  ): Promise<ApiResponse<DeleteResponse>> {
    return this.articles
      .delete({ ...body, id: params.id })
      .then(() => toResponse({ id: params.id }));
  }
}
