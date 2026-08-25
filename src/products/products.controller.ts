import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { GetUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../common/guards/auth.guard.js';
import { UserRole } from '../../generated/prisma/enums.js';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Crear producto (admin)' })
  @ApiResponse({ status: 201, description: 'Producto creado' })
  @ApiResponse({
    status: 400,
    description: 'Nombre duplicado o datos inválidos',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  @Get()
  @ApiOperation({
    summary:
      'Listar productos. ADMIN ve todos; CASHIER solo activos e isSellable.',
  })
  @ApiResponse({ status: 200, description: 'Lista de productos' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  findAll(@GetUser() actor: JwtPayload) {
    return this.productsService.findAllForRole(actor.role);
  }
}
