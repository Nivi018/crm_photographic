import { ArticleType } from '@crm-photografy/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiProperty({ enum: ArticleType }) @IsEnum(ArticleType) type!: ArticleType;
  @ApiProperty() @IsString() @IsNotEmpty() categoryId!: string;
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
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
}

export class ListArticlesDto {
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ enum: ArticleType }) @IsOptional() @IsEnum(ArticleType) type?: ArticleType;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean() isActive?: boolean;
}
