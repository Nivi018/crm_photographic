import {
  type ApiPaginatedResponse,
  type ApiResponse,
  type CategoryResponse,
} from '@crm-photografy/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class UpdateCategoryDto extends CreateCategoryDto {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  expectedVersion!: number;
}

export class CategoryStateDto {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  expectedVersion!: number;
}

export class CategoryIdParamDto {
  @ApiProperty()
  @IsUUID()
  id!: string;
}

export class ListCategoriesDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(parseBooleanLiteral)
  @IsBoolean()
  isActive?: boolean;
}

export type CategoryResponseDto = ApiResponse<CategoryResponse>;
export type CategoryPageResponseDto = ApiPaginatedResponse<CategoryResponse>;

function parseBooleanLiteral({ value }: { value: unknown }): unknown {
  return value === 'true' ? true : value === 'false' ? false : value;
}
