import { Controller, Get } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';

import { ApiErrorResponseDto } from './inventory/presentation/api-response.dto';

import { HealthResponse, HealthService } from './health.service';

class HealthResponseDto {
  @ApiProperty({ enum: ['ok'] })
  status!: 'ok';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Consulta el estado operativo de la API' })
  @ApiOkResponse({ description: 'La API esta operativa.', type: HealthResponseDto })
  @ApiInternalServerErrorResponse({
    description: 'Unexpected internal error.',
    type: ApiErrorResponseDto,
  })
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }
}
