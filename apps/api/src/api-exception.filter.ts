import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ExceptionFilter } from '@nestjs/common';
import { InventoryErrorCode } from '@crm-photografy/shared';
import type { Response } from 'express';

interface ErrorResponseBody {
  code?: unknown;
  details?: unknown;
  message?: unknown;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const httpException = exception instanceof HttpException ? exception : undefined;
    const statusCode = httpException?.getStatus() ?? domainErrorStatus(exception);
    const body = httpException?.getResponse() ?? {};
    const error = isErrorResponseBody(body) ? body : {};

    response.status(statusCode).json({
      code: httpException ? errorCode(error.code, statusCode) : domainErrorCode(exception),
      ...(error.details === undefined ? {} : { details: error.details }),
      message: httpException
        ? errorMessage(error.message, body)
        : errorMessageFromException(exception),
      statusCode,
    });
  }
}

function domainErrorStatus(error: unknown): HttpStatus {
  return domainErrorCode(error) === InventoryErrorCode.NotFound
    ? HttpStatus.NOT_FOUND
    : domainErrorCode(error) === InventoryErrorCode.NameConflict ||
        domainErrorCode(error) === InventoryErrorCode.DependencyConflict
      ? HttpStatus.CONFLICT
      : HttpStatus.BAD_REQUEST;
}

function domainErrorCode(error: unknown): InventoryErrorCode {
  const name = error instanceof Error ? error.name : '';

  if (name === 'CategoryNotFoundError') return InventoryErrorCode.NotFound;
  if (name === 'ArticleNotFoundError') return InventoryErrorCode.NotFound;
  if (name === 'CategoryNameConflictError') return InventoryErrorCode.NameConflict;
  if (name === 'ArticleNameConflictError') return InventoryErrorCode.NameConflict;
  if (name === 'ActiveArticleAssociationError' || name === 'CategoryAssociationError') {
    return InventoryErrorCode.DependencyConflict;
  }
  if (name === 'ArticleInactiveError') return InventoryErrorCode.ArticleInactive;
  if (name === 'CategoryInactiveError') return InventoryErrorCode.CategoryInactive;
  if (name === 'NegativeStockConfirmationRequiredError') {
    return InventoryErrorCode.NegativeStockConfirmationRequired;
  }
  if (name === 'ConcurrentModificationError') return InventoryErrorCode.ConcurrentModification;
  if (name === 'StockOutOfRangeError') return InventoryErrorCode.StockOutOfRange;
  if (name === 'NoStockDifferenceError') return InventoryErrorCode.NoStockDifference;

  return InventoryErrorCode.Validation;
}

function errorMessageFromException(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

function isErrorResponseBody(value: unknown): value is ErrorResponseBody {
  return typeof value === 'object' && value !== null;
}

function errorCode(value: unknown, statusCode: number): InventoryErrorCode {
  if (
    typeof value === 'string' &&
    Object.values(InventoryErrorCode).includes(value as InventoryErrorCode)
  ) {
    return value as InventoryErrorCode;
  }

  return statusCode === HttpStatus.NOT_FOUND
    ? InventoryErrorCode.NotFound
    : InventoryErrorCode.Validation;
}

function errorMessage(message: unknown, fallback: string | object): string {
  if (typeof message === 'string') {
    return message;
  }

  if (typeof fallback === 'string') {
    return fallback;
  }

  return 'Request failed';
}
