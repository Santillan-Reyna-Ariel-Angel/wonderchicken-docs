import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ShiftsService } from './shifts.service.js';
import { OpenShiftDto } from './dto/open-shift.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { GetUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/guards/auth.guard.js';
import { UserRole } from '../../generated/prisma/enums.js';

@ApiTags('shifts')
@ApiBearerAuth()
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Roles(UserRole.CASHIER, UserRole.ADMIN)
  @Get('shift-periods')
  @ApiOperation({ summary: 'Listar períodos de turno activos' })
  @ApiResponse({ status: 200, description: 'Catálogo de períodos' })
  listPeriods() {
    return this.shiftsService.listPeriods();
  }

  @Roles(UserRole.CASHIER)
  @Post('open')
  @ApiOperation({
    summary:
      'Abrir turno de caja declarando el período (no se infiere del reloj)',
  })
  @ApiResponse({ status: 201, description: 'Turno abierto' })
  @ApiResponse({
    status: 400,
    description: 'Período o caja inexistente / usuario sin sucursal',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  open(@Body() dto: OpenShiftDto, @GetUser() actor: JwtPayload) {
    return this.shiftsService.open(dto, actor);
  }

  @Roles(UserRole.CASHIER)
  @Get('active')
  @ApiOperation({
    summary:
      'Obtener el turno activo de la cajera. Devuelve shift: null si no hay.',
  })
  @ApiResponse({ status: 200, description: 'Turno activo (o null)' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async getActive(@GetUser() actor: JwtPayload) {
    const shift = await this.shiftsService.findActiveForUser(actor);
    return {
      isSuccess: true,
      message: shift ? 'Turno activo obtenido' : 'No hay turno activo',
      data: { shift },
      error: null,
    };
  }
}
