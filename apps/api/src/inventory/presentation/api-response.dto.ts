import {
  AdjustmentMode,
  ArticleType,
  InventoryErrorCode,
  MovementKind,
  MovementSource,
} from '@crm-photografy/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidationFieldDto {
  @ApiProperty() field!: string;
  @ApiProperty() message!: string;
}

export class ValidationDetailsDto {
  @ApiProperty({ type: [ValidationFieldDto] }) fields!: ValidationFieldDto[];
}

export class NegativeStockConfirmationDetailsDto {
  @ApiProperty() stockAfter!: number;
}

export class ApiErrorResponseDto {
  @ApiProperty({ enum: InventoryErrorCode }) code!: InventoryErrorCode;
  @ApiProperty() message!: string;
  @ApiProperty() statusCode!: number;
  @ApiPropertyOptional({
    oneOf: [
      { $ref: '#/components/schemas/ValidationDetailsDto' },
      { $ref: '#/components/schemas/NegativeStockConfirmationDetailsDto' },
    ],
  })
  details?: ValidationDetailsDto | NegativeStockConfirmationDetailsDto;
}

export class ValidationErrorResponseDto extends ApiErrorResponseDto {
  @ApiProperty({ enum: [InventoryErrorCode.Validation], example: InventoryErrorCode.Validation })
  declare code: InventoryErrorCode.Validation;
  @ApiProperty({ type: ValidationDetailsDto })
  declare details: ValidationDetailsDto;
}

export class NegativeStockConfirmationErrorResponseDto extends ApiErrorResponseDto {
  @ApiProperty({
    enum: [InventoryErrorCode.NegativeStockConfirmationRequired],
    example: InventoryErrorCode.NegativeStockConfirmationRequired,
  })
  declare code: InventoryErrorCode.NegativeStockConfirmationRequired;
  @ApiProperty({ type: NegativeStockConfirmationDetailsDto })
  declare details: NegativeStockConfirmationDetailsDto;
}

export class ArticlePublicDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) categoryId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ArticleType }) type!: ArticleType;
  @ApiProperty() initialStock!: number;
  @ApiProperty() currentStock!: number;
  @ApiProperty() minimumStock!: number;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() hasLowStock!: boolean;
  @ApiProperty({ minimum: 0 }) version!: number;
}

export class CategoryPublicDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty({ minimum: 0 }) version!: number;
}

export class MovementPublicDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) articleId!: string;
  @ApiProperty() sequence!: string;
  @ApiProperty({ enum: MovementKind }) kind!: MovementKind;
  @ApiProperty({ enum: MovementSource }) source!: MovementSource;
  @ApiProperty({ enum: AdjustmentMode, nullable: true }) adjustmentMode!: AdjustmentMode | null;
  @ApiProperty() appliedQuantity!: number;
  @ApiProperty() stockBefore!: number;
  @ApiProperty() stockAfter!: number;
  @ApiProperty() reason!: string;
  @ApiProperty({ format: 'date-time' }) occurredAt!: string;
}

export class PaginationMetaDto {
  @ApiProperty({ minimum: 1 }) page!: number;
  @ApiProperty({ minimum: 1 }) pageSize!: number;
  @ApiProperty({ minimum: 0 }) totalItems!: number;
  @ApiProperty({ minimum: 0 }) totalPages!: number;
}

export class ArticleResponseEnvelopeDto {
  @ApiProperty({ type: ArticlePublicDto }) data!: ArticlePublicDto;
}

export class ArticlePageResponseEnvelopeDto {
  @ApiProperty({ type: [ArticlePublicDto] }) data!: ArticlePublicDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class CategoryResponseEnvelopeDto {
  @ApiProperty({ type: CategoryPublicDto }) data!: CategoryPublicDto;
}

export class CategoryPageResponseEnvelopeDto {
  @ApiProperty({ type: [CategoryPublicDto] }) data!: CategoryPublicDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class MovementOperationPublicDto {
  @ApiProperty({ type: ArticlePublicDto }) article!: ArticlePublicDto;
  @ApiProperty({ type: MovementPublicDto }) movement!: MovementPublicDto;
}

export class MovementResponseEnvelopeDto {
  @ApiProperty({ type: MovementOperationPublicDto }) data!: MovementOperationPublicDto;
}

export class MovementPageResponseEnvelopeDto {
  @ApiProperty({ type: [MovementPublicDto] }) data!: MovementPublicDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class DeleteResponseEnvelopeDto {
  @ApiProperty({ type: 'object', properties: { id: { type: 'string', format: 'uuid' } } })
  data!: { id: string };
}
