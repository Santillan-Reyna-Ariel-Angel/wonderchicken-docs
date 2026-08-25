import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BranchesService } from './branches.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../../generated/prisma/enums.js';

@ApiTags('branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  @ApiOperation({ summary: 'Crear sucursal (SUPER_ADMIN)' })
  @ApiResponse({ status: 201, description: 'Sucursal creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Listar sucursales (SUPER_ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de sucursales' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  findAll() {
    return this.branchesService.findAll();
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar sucursal (SUPER_ADMIN)' })
  @ApiResponse({ status: 200, description: 'Sucursal actualizada' })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBranchDto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(':id/toggle-active')
  @ApiOperation({
    summary: 'Activar/desactivar sucursal (toggle) (SUPER_ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado activo/inactivo actualizado',
  })
  @ApiResponse({ status: 404, description: 'No encontrada' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.toggleActive(id);
  }
}
