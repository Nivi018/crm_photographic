import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ExceptionFilter } from '@nestjs/common';
import { InventoryErrorCode } from '@crm-photografy/shared';
import type { Response } from 'express';

interface ErrorResponseBody {
  code?: unknown;
  details?: unknown;
  message?: unknown;
}

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = exception.getStatus();
    const body = exception.getResponse();
    const error = isErrorResponseBody(body) ? body : {};

    response.status(statusCode).json({
      code: errorCode(error.code, statusCode),
      ...(error.details === undefined ? {} : { details: error.details }),
      message: errorMessage(error.message, body),
      statusCode,
    });
  }
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
