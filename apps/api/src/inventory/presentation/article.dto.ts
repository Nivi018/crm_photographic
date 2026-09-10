import {
  type ApiPaginatedResponse,
  type ApiResponse,
  type ArticleResponse,
  ArticleType,
} from '@crm-photografy/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiProperty({ enum: ArticleType }) @IsEnum(ArticleType) type!: ArticleType;
  @ApiProperty() @IsUUID() categoryId!: string;
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) initialStock!: number;
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) minimumStock!: number;
}

export class UpdateArticleDto extends CreateArticleDto {
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) expectedVersion!: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() confirmNegativeStock?: boolean;
}

export class ArticleStateDto {
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) expectedVersion!: number;
}

export class ReactivateArticleDto extends ArticleStateDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
}

export class ArticleIdParamDto {
  @ApiProperty() @IsUUID() id!: string;
}

export class ListArticlesDto {
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ enum: ArticleType }) @IsOptional() @IsEnum(ArticleType) type?: ArticleType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(parseBooleanLiteral)
  @IsBoolean()
  isActive?: boolean;
}

export type ArticleResponseDto = ApiResponse<ArticleResponse>;
export type ArticlePageResponseDto = ApiPaginatedResponse<ArticleResponse>;

function parseBooleanLiteral({ value }: { value: unknown }): unknown {
  return value === 'true' ? true : value === 'false' ? false : value;
}
