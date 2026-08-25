import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UserRole } from '../../generated/prisma/enums.js';

const productSelect = {
  id: true,
  name: true,
  basePrice: true,
  category: true,
  description: true,
  active: true,
  isSellable: true,
  isInventoryItem: true,
  createdAt: true,
  updatedAt: true,
} as const;

const productWithVariantsSelect = {
  ...productSelect,
  variants: {
    where: { active: true },
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
  },
} as const;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // Product.name no es @unique en el schema (Branch.name sí lo es).
    // Usamos findFirst para chequear duplicados lógicos.
    const existing = await this.prisma.product.findFirst({
      where: { name: createProductDto.name },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        `Ya existe un producto con el nombre "${createProductDto.name}"`,
      );
    }

    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        basePrice: new Prisma.Decimal(createProductDto.basePrice),
        category: createProductDto.category,
        description: createProductDto.description ?? null,
        active: true,
        isSellable: createProductDto.isSellable ?? true,
        isInventoryItem: createProductDto.isInventoryItem ?? true,
      },
      select: productSelect,
    });

    this.logger.log(`Producto creado: ${product.name} (${product.id})`);

    return {
      isSuccess: true,
      message: 'Producto creado correctamente',
      data: { product },
      error: null,
    };
  }

  async findAllForRole(role: UserRole) {
    const where: Prisma.ProductWhereInput =
      role === UserRole.CASHIER ? { active: true, isSellable: true } : {};

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: productWithVariantsSelect,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      isSuccess: true,
      message: 'Productos obtenidos correctamente',
      data: { products, total },
      error: null,
    };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: productWithVariantsSelect,
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }
}
