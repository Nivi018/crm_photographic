import { Controller, Get, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InventoryErrorCode } from '@crm-photografy/shared';

import { ApiErrorResponseDto } from './inventory/presentation/api-response.dto';

import { HealthResponse, HealthService, ReadinessHealthResponse } from './health.service';

class LivenessResponseDto {
  @ApiProperty({ enum: ['ok'] })
  status!: 'ok';
}

class LivenessResponseEnvelopeDto {
  @ApiProperty({ type: LivenessResponseDto })
  data!: LivenessResponseDto;
}

class ReadinessResponseDto {
  @ApiProperty({ enum: ['ready'] })
  status!: 'ready';
  @ApiProperty({ enum: ['available'] })
  database!: 'available';
}

class ReadinessResponseEnvelopeDto {
  @ApiProperty({ type: ReadinessResponseDto })
  data!: ReadinessResponseDto;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Consulta el estado operativo de la API' })
  @ApiOkResponse({ description: 'La API esta operativa.', type: LivenessResponseEnvelopeDto })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected internal error.',
    type: ApiErrorResponseDto,
  })
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Comprueba la disponibilidad de PostgreSQL y el esquema de inventario' })
  @ApiOkResponse({
    description: 'PostgreSQL y el esquema de inventario estan disponibles.',
    type: ReadinessResponseEnvelopeDto,
  })
  @ApiServiceUnavailableResponse({
    description: 'PostgreSQL o el esquema de inventario no estan disponibles.',
    type: ApiErrorResponseDto,
  })
  async getReadiness(): Promise<ReadinessHealthResponse> {
    try {
      return await this.healthService.getReadiness();
    } catch {
      throw new ServiceUnavailableException({
        code: InventoryErrorCode.ServiceUnavailable,
        message: 'Database is unavailable',
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      });
    }
  }
}
