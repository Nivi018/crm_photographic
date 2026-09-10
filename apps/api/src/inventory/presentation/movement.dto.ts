import {
  type ApiPaginatedResponse,
  type ApiResponse,
  type MovementOperationResponse,
  type MovementResponse,
} from '@crm-photografy/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class MovementDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) quantity!: number;
  @ApiProperty() @IsString() @IsNotEmpty() reason!: string;
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) expectedVersion!: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() confirmNegativeStock?: boolean;
}

export class FinalStockAdjustmentDto {
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) finalStock!: number;
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) expectedVersion!: number;
}

export class DeltaAdjustmentDto {
  @ApiProperty() @IsInt() quantity!: number;
  @ApiProperty() @IsString() @IsNotEmpty() reason!: string;
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) expectedVersion!: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() confirmNegativeStock?: boolean;
}

export class MovementListDto {
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
}

export class ArticleIdParamDto {
  @ApiProperty()
  @IsUUID()
  id!: string;
}

export type MovementResponseDto = ApiResponse<MovementOperationResponse>;
export type MovementPageResponseDto = ApiPaginatedResponse<MovementResponse>;
