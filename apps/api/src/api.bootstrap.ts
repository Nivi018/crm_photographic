import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { INestApplication, ValidationError } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { InventoryErrorCode } from '@crm-photografy/shared';

import { ApiExceptionFilter } from './api-exception.filter';

interface ValidationDetail {
  field: string;
  message: string;
}

export function configureApplication(app: INestApplication): void {
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          code: InventoryErrorCode.Validation,
          details: { fields: validationDetails(errors) },
          message: 'Request validation failed',
        }),
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
}

export function createSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('CRM Photography API')
    .setDescription('API del inventario del estudio fotografico.')
    .setVersion('0.1.0')
    .addTag('health')
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup('api/docs', app, createSwaggerDocument(app));
}

function validationDetails(errors: ValidationError[], parent = ''): ValidationDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const ownDetails = Object.values(error.constraints ?? {}).map((message) => ({
      field,
      message,
    }));

    return [...ownDetails, ...validationDetails(error.children ?? [], field)];
  });
}
