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

import { CategoryService } from '../application/categories/category.service';
import {
  CategoryStateDto,
  CategoryIdParamDto,
  type CategoryPageResponseDto,
  type CategoryResponseDto,
  CreateCategoryDto,
  ListCategoriesDto,
  UpdateCategoryDto,
} from './category.dto';
import { toCategoryResponse, toPaginatedResponse, toResponse } from './inventory.mapper';
import type { ApiResponse, DeleteResponse } from '@crm-photografy/shared';

@ApiTags('inventory-categories')
@Controller('api/inventory/categories')
export class CategoryController {
  constructor(private readonly categories: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory categories' })
  list(@Query() query: ListCategoriesDto): Promise<CategoryPageResponseDto> {
    return this.categories
      .list({
        page: query.page,
        ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
      })
      .then((page) => toPaginatedResponse(page, toCategoryResponse));
  }

  @Post()
  @ApiOperation({ summary: 'Create an inventory category' })
  create(@Body() body: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categories
      .create(body.name)
      .then((category) => toResponse(toCategoryResponse(category)));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename an inventory category' })
  update(
    @Param() params: CategoryIdParamDto,
    @Body() body: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categories
      .rename({ id: params.id, name: body.name, expectedVersion: body.expectedVersion })
      .then((category) => toResponse(toCategoryResponse(category)));
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate an inventory category' })
  deactivate(
    @Param() params: CategoryIdParamDto,
    @Body() body: CategoryStateDto,
  ): Promise<CategoryResponseDto> {
    return this.categories
      .deactivate({ id: params.id, expectedVersion: body.expectedVersion })
      .then((category) => toResponse(toCategoryResponse(category)));
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate an inventory category' })
  reactivate(
    @Param() params: CategoryIdParamDto,
    @Body() body: CategoryStateDto,
  ): Promise<CategoryResponseDto> {
    return this.categories
      .reactivate({ id: params.id, expectedVersion: body.expectedVersion })
      .then((category) => toResponse(toCategoryResponse(category)));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an inventory category' })
  remove(
    @Param() params: CategoryIdParamDto,
    @Body() body: CategoryStateDto,
  ): Promise<ApiResponse<DeleteResponse>> {
    return this.categories
      .delete({ id: params.id, expectedVersion: body.expectedVersion })
      .then(() => toResponse({ id: params.id }));
  }
}
