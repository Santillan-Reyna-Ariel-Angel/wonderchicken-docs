import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PayOrderDto } from './dto/pay-order.dto.js';
import { ListOrdersDto } from './dto/list-orders.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { GetUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/guards/auth.guard.js';
import { UserRole } from '../../generated/prisma/enums.js';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(UserRole.CASHIER)
  @Post()
  @ApiOperation({
    summary:
      'Crear pedido estándar MESA/LLEVAR con N ítems. Total calculado en backend.',
  })
  @ApiResponse({ status: 201, description: 'Pedido creado' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos / producto inactivo',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 409, description: 'Sin turno activo' })
  create(@Body() dto: CreateOrderDto, @GetUser() actor: JwtPayload) {
    return this.ordersService.create(dto, actor);
  }

  @Roles(UserRole.CASHIER)
  @Post(':id/pay')
  @ApiOperation({
    summary:
      'Confirmar pago de un pedido pendiente. Descuenta inventario (Sprint 2).',
  })
  @ApiResponse({ status: 200, description: 'Pago confirmado' })
  @ApiResponse({ status: 403, description: 'Pedido de otra sucursal' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya pagado o cancelado' })
  pay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PayOrderDto,
    @GetUser() actor: JwtPayload,
  ) {
    return this.ordersService.pay(id, dto, actor);
  }

  @Roles(UserRole.CASHIER)
  @Post(':id/cancel')
  @ApiOperation({
    summary:
      'Cancelar pedido pendiente (manual, sin motivo). Pagados llegan en Sprint 2.',
  })
  @ApiResponse({ status: 200, description: 'Pedido cancelado' })
  @ApiResponse({ status: 403, description: 'Pedido de otra sucursal' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 409, description: 'Pedido ya pagado' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @GetUser() actor: JwtPayload) {
    return this.ordersService.cancel(id, actor);
  }

  @Roles(UserRole.CASHIER, UserRole.DISPATCHER, UserRole.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener pedido por id' })
  @ApiResponse({ status: 200, description: 'Pedido' })
  @ApiResponse({ status: 403, description: 'Pedido de otra sucursal' })
  @ApiResponse({ status: 404, description: 'No encontrado' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() actor: JwtPayload,
  ) {
    return this.ordersService.findById(id, actor);
  }

  @Roles(UserRole.CASHIER, UserRole.DISPATCHER, UserRole.ADMIN)
  @Get()
  @ApiOperation({
    summary:
      'Listar pedidos con filtros (panel despacho + historial). Restringido por sucursal.',
  })
  @ApiResponse({ status: 200, description: 'Lista de pedidos' })
  list(@Query() query: ListOrdersDto, @GetUser() actor: JwtPayload) {
    return this.ordersService.list(query, actor);
  }
}
