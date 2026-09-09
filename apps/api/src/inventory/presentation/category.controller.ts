import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CategoryService } from '../application/categories/category.service';
import {
  CategoryStateDto,
  CreateCategoryDto,
  ListCategoriesDto,
  UpdateCategoryDto,
} from './category.dto';

@ApiTags('inventory-categories')
@Controller('api/inventory/categories')
export class CategoryController {
  constructor(private readonly categories: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory categories' })
  list(@Query() query: ListCategoriesDto) {
    return this.categories.list({
      page: query.page,
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create an inventory category' })
  create(@Body() body: CreateCategoryDto) {
    return this.categories.create(body.name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename an inventory category' })
  update(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    return this.categories.rename({ id, name: body.name, expectedVersion: body.expectedVersion });
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate an inventory category' })
  deactivate(@Param('id') id: string, @Body() body: CategoryStateDto) {
    return this.categories.deactivate({ id, expectedVersion: body.expectedVersion });
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate an inventory category' })
  reactivate(@Param('id') id: string, @Body() body: CategoryStateDto) {
    return this.categories.reactivate({ id, expectedVersion: body.expectedVersion });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an inventory category' })
  remove(@Param('id') id: string, @Body() body: CategoryStateDto) {
    return this.categories.delete({ id, expectedVersion: body.expectedVersion });
  }
}
