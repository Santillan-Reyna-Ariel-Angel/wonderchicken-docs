import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PosService } from './pos.service.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { GetUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/guards/auth.guard.js';
import { UserRole } from '../../generated/prisma/enums.js';

@ApiTags('pos')
@ApiBearerAuth()
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Roles(UserRole.CASHIER)
  @Get('context')
  @ApiOperation({
    summary:
      'Carga única del POS: productos + variantes + períodos + turno activo.',
  })
  @ApiResponse({ status: 200, description: 'Contexto del POS' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  getContext(@GetUser() actor: JwtPayload) {
    return this.posService.getContext(actor);
  }
}
