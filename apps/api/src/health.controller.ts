import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';

import { HealthResponse, HealthService } from './health.service';

class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Consulta el estado operativo de la API' })
  @ApiOkResponse({ description: 'La API esta operativa.', type: HealthResponseDto })
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }
}
