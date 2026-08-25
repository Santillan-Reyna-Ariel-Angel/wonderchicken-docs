import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { FindUsersQueryDto } from './dto/find-users-query.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { GetUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/guards/auth.guard.js';
import { UserRole } from '../../generated/prisma/enums.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Crear usuario (admin)' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 400, description: 'Username duplicado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Listar usuarios con filtro por rol (admin)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  @ApiResponse({ status: 400, description: 'Filtro de rol inválido' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query.role);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por id (admin)' })
  @ApiResponse({ status: 200, description: 'Usuario obtenido' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({
    summary:
      'Editar usuario (admin). NO permite cambiar active; usar PATCH /users/:id/toggle-active',
  })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o active en payload',
  })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/toggle-active')
  @ApiOperation({
    summary: 'Activar/desactivar usuario (toggle) (ADMIN | SUPER_ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado activo/inactivo actualizado',
  })
  @ApiResponse({ status: 400, description: 'Auto-toggle no permitido' })
  @ApiResponse({ status: 403, description: 'Sin permisos sobre ese rol' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() actor: JwtPayload,
  ) {
    return this.usersService.toggleActive(id, actor);
  }
}
