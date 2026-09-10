import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { ApiErrorResponseDto, NegativeStockConfirmationErrorResponseDto } from './api-response.dto';

export function ApiInventoryErrorResponses(options: {
  badRequest: string;
  conflict?: string;
  negativeStockConfirmation?: boolean;
  notFound?: string;
}): MethodDecorator {
  return applyDecorators(
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
