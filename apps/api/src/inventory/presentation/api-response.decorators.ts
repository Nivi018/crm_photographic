import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import {
  ApiErrorResponseDto,
  NegativeStockConfirmationDetailsDto,
  NegativeStockConfirmationErrorResponseDto,
  ValidationDetailsDto,
  ValidationFieldDto,
} from './api-response.dto';

export function ApiInventoryErrorResponses(options: {
  badRequest: string;
  conflict?: string;
  negativeStockConfirmation?: boolean;
  notFound?: string;
}): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ValidationFieldDto, ValidationDetailsDto, NegativeStockConfirmationDetailsDto),
    ApiBadRequestResponse({
      description: options.badRequest,
      type: options.negativeStockConfirmation
        ? NegativeStockConfirmationErrorResponseDto
        : ApiErrorResponseDto,
    }),
    ...(options.notFound
      ? [ApiNotFoundResponse({ description: options.notFound, type: ApiErrorResponseDto })]
      : []),
    ...(options.conflict
      ? [ApiConflictResponse({ description: options.conflict, type: ApiErrorResponseDto })]
      : []),
    ApiInternalServerErrorResponse({
      description: 'Unexpected internal error.',
      type: ApiErrorResponseDto,
    }),
  );
}
