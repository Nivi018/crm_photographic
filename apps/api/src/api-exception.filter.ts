import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ExceptionFilter } from '@nestjs/common';
import { InventoryErrorCode } from '@crm-photografy/shared';
import type { Response } from 'express';

import { isInventoryError } from './inventory/domain/inventory-error';

interface ErrorResponseBody {
  code?: unknown;
  details?: unknown;
  message?: unknown;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const error = classifyError(exception);

    response.status(error.statusCode).json(error);
  }
}

function classifyError(exception: unknown): {
  code: InventoryErrorCode;
  details?: unknown;
  message: string;
  statusCode: number;
} {
  if (isInventoryError(exception)) {
    return {
      code: exception.code,
      ...(exception.details === undefined ? {} : { details: exception.details }),
      message: exception.message,
      statusCode: statusForCode(exception.code),
    };
  }

  if (exception instanceof HttpException) {
    return classifyHttpException(exception);
  }

  return {
    code: InventoryErrorCode.Internal,
    message: 'An unexpected error occurred',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  };
}

function classifyHttpException(exception: HttpException): {
  code: InventoryErrorCode;
  details?: unknown;
  message: string;
  statusCode: number;
} {
  const statusCode = exception.getStatus();
  const body = exception.getResponse();
  const error = isErrorResponseBody(body) ? body : {};
  const code = validErrorCode(error.code) ?? defaultCodeForStatus(statusCode);

  if (
    statusCode >= HttpStatus.INTERNAL_SERVER_ERROR &&
    !(
      statusCode === HttpStatus.SERVICE_UNAVAILABLE &&
      code === InventoryErrorCode.ServiceUnavailable
    )
  ) {
    return {
      code: InventoryErrorCode.Internal,
      message: 'An unexpected error occurred',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  return {
    code,
    ...(error.details === undefined ? {} : { details: error.details }),
    message: typeof error.message === 'string' ? error.message : 'Request failed',
    statusCode,
  };
}

function statusForCode(code: InventoryErrorCode): HttpStatus {
  switch (code) {
    case InventoryErrorCode.NotFound:
      return HttpStatus.NOT_FOUND;
    case InventoryErrorCode.NameConflict:
    case InventoryErrorCode.DependencyConflict:
    case InventoryErrorCode.ConcurrentModification:
      return HttpStatus.CONFLICT;
    case InventoryErrorCode.Internal:
      return HttpStatus.INTERNAL_SERVER_ERROR;
    case InventoryErrorCode.ServiceUnavailable:
      return HttpStatus.SERVICE_UNAVAILABLE;
    default:
      return HttpStatus.BAD_REQUEST;
  }
}

function defaultCodeForStatus(statusCode: number): InventoryErrorCode {
  return statusCode === HttpStatus.NOT_FOUND
    ? InventoryErrorCode.NotFound
    : InventoryErrorCode.Validation;
}

function isErrorResponseBody(value: unknown): value is ErrorResponseBody {
  return typeof value === 'object' && value !== null;
}

function validErrorCode(value: unknown): InventoryErrorCode | undefined {
  return typeof value === 'string' &&
    Object.values(InventoryErrorCode).includes(value as InventoryErrorCode)
    ? (value as InventoryErrorCode)
    : undefined;
}
