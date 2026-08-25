import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VariantsService } from './variants.service.js';
import { CreateVariantDto } from './dto/create-variant.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../generated/prisma/enums.js';

@ApiTags('variants')
@ApiBearerAuth()
@Controller('variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Crear variante de un producto (admin)' })
  @ApiResponse({ status: 201, description: 'Variante creada' })
  @ApiResponse({
    status: 400,
    description: 'Producto inexistente o datos inválidos',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  create(@Body() createVariantDto: CreateVariantDto) {
    return this.variantsService.create(createVariantDto);
  }
}
