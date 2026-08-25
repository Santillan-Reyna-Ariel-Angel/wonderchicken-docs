import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateVariantDto } from './dto/create-variant.dto.js';

@Injectable()
export class VariantsService {
  private readonly logger = new Logger(VariantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createVariantDto: CreateVariantDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: createVariantDto.productId },
      select: { id: true },
    });

    if (!product) {
      throw new BadRequestException(
        `El producto "${createVariantDto.productId}" no existe`,
      );
    }

    const variant = await this.prisma.variant.create({
      data: {
        productId: createVariantDto.productId,
        name: createVariantDto.name,
        components:
          createVariantDto.components as unknown as Prisma.InputJsonValue,
        isDefault: createVariantDto.isDefault ?? false,
        active: true,
      },
      select: {
        id: true,
        productId: true,
        name: true,
        components: true,
        isDefault: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Variante creada: ${variant.name} (${variant.id})`);

    return {
      isSuccess: true,
      message: 'Variante creada correctamente',
      data: { variant },
      error: null,
    };
  }
}
