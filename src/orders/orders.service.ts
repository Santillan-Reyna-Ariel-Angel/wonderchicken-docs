import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PayOrderDto } from './dto/pay-order.dto.js';
import { ListOrdersDto } from './dto/list-orders.dto.js';
import type { JwtPayload } from '../common/guards/auth.guard.js';
import { UserRole } from '../../generated/prisma/enums.js';
import {
  assignOrderNumber,
  buildOrderItemComponents,
  buildOrderItemSnapshot,
  generatePublicToken,
  summarizeItems,
} from './orders.helpers.js';

const ALLOWED_SUBSTITUTION_TARGETS = [
  'arroz',
  'papa',
  'smiles',
  'mixto',
] as const;

const orderInclude = {
  items: {
    select: {
      id: true,
      productId: true,
      variantId: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      snapshot: true,
      substitutions: true,
      selectedPieces: true,
      customPieces: true,
      extras: true,
      drinks: true,
      notes: true,
      createdAt: true,
    },
  },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  shift: {
    select: {
      id: true,
      branchId: true,
      lastOrderNumber: true,
      cashier: { select: { id: true, firstName: true, lastName: true } },
      period: { select: { id: true, name: true } },
    },
  },
} as const;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly shiftsService: ShiftsService,
  ) {}

  /**
   * Resolves the user's branchId from the User table. JwtPayload doesn't carry
   * branchId (Sprint 0), so we fetch it on demand.
   */
  private async resolveUserBranchId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { branchId: true },
    });

    if (!user?.branchId) {
      throw new BadRequestException(
        'El usuario no tiene una sucursal asignada. Contacte al administrador.',
      );
    }

    return user.branchId;
  }

  private validateSubstitutions(
    substitutions: Array<{ from: string; to: string }> | undefined,
  ): void {
    if (!substitutions || substitutions.length === 0) {
      return;
    }

    if (substitutions.length > 1) {
      throw new BadRequestException({
        message: 'Solo se permite una sustitución por ítem (PDR §2.1)',
        error: 'MULTIPLE_SUBSTITUTIONS_NOT_ALLOWED',
      });
    }

    const sub = substitutions[0];
    if (sub.from !== 'mixto') {
      throw new BadRequestException({
        message:
          'La sustitución solo aplica al acompañamiento por defecto (mixto)',
        error: 'INVALID_SUBSTITUTION_TARGET',
      });
    }

    if (!ALLOWED_SUBSTITUTION_TARGETS.includes(sub.to as never)) {
      throw new BadRequestException({
        message: `Destino de sustitución inválido: "${sub.to}". Permitidos: ${ALLOWED_SUBSTITUTION_TARGETS.join(', ')}`,
        error: 'INVALID_SUBSTITUTION_TARGET',
      });
    }
  }

  async create(dto: CreateOrderDto, actor: JwtPayload) {
    if (dto.type === 'MESA' && !dto.tableNumber) {
      throw new BadRequestException(
        'El número de mesa es obligatorio para pedidos MESA',
      );
    }

    if (dto.paymentStatus === 'PAID' && !dto.paymentMethod) {
      throw new BadRequestException(
        'El método de pago es obligatorio cuando el pedido se crea pagado',
      );
    }

    await this.resolveUserBranchId(actor.sub);
    const shift = await this.shiftsService.findActiveForUserOrThrow(actor);

    // Validate substitutions up-front (cheap, no DB).
    for (const item of dto.items) {
      this.validateSubstitutions(item.substitutions);
    }

    const order = await this.prisma.$transaction(async (tx) => {
      // Load all referenced products + variants in two queries.
      const productIds = Array.from(new Set(dto.items.map((i) => i.productId)));
      const variantIds = Array.from(
        new Set(
          dto.items.map((i) => i.variantId).filter((v): v is string => !!v),
        ),
      );

      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          basePrice: true,
          active: true,
          isSellable: true,
        },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of dto.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new BadRequestException({
            message: `Producto "${item.productId}" no encontrado`,
            error: 'PRODUCT_NOT_FOUND',
          });
        }
        if (!product.active || !product.isSellable) {
          throw new BadRequestException({
            message: `Producto "${product.name}" no está disponible para la venta`,
            error: 'PRODUCT_INACTIVE',
          });
        }
      }

      const variants = variantIds.length
        ? await tx.variant.findMany({
            where: { id: { in: variantIds } },
            select: {
              id: true,
              productId: true,
              name: true,
              components: true,
              active: true,
            },
          })
        : [];

      const variantMap = new Map(variants.map((v) => [v.id, v]));

      for (const item of dto.items) {
        if (!item.variantId) continue;
        const variant = variantMap.get(item.variantId);
        if (
          !variant ||
          !variant.active ||
          variant.productId !== item.productId
        ) {
          throw new BadRequestException({
            message: `Variante "${item.variantId}" no encontrada o no pertenece al producto`,
            error: 'VARIANT_NOT_FOUND',
          });
        }
      }

      // Compute totals from catalog (PDR §2.2 — backend manda).
      const itemRows = dto.items.map((item) => {
        const product = productMap.get(item.productId)!;
        const variant = item.variantId
          ? (variantMap.get(item.variantId) ?? null)
          : null;
        const unitPrice =
          product.basePrice instanceof Prisma.Decimal
            ? product.basePrice.toNumber()
            : Number(product.basePrice);
        const totalPrice = unitPrice * item.quantity;
        return { item, product, variant, unitPrice, totalPrice };
      });

      const originalAmount = itemRows.reduce((acc, r) => acc + r.totalPrice, 0);

      // Atomic orderNumber assignment.
      const orderNumber = await assignOrderNumber(tx, shift.id);
      const publicToken = generatePublicToken();

      const created = await tx.order.create({
        data: {
          orderNumber,
          type: dto.type,
          tableNumber: dto.tableNumber ?? null,
          customerId: dto.customerId ?? null,
          publicToken,
          status: 'PREPARING',
          paymentStatus: dto.paymentStatus,
          paymentMethod: dto.paymentMethod ?? null,
          originalAmount: new Prisma.Decimal(originalAmount),
          total: new Prisma.Decimal(originalAmount),
          isCustom: false,
          createdById: actor.sub,
          shiftId: shift.id,
        },
        select: { id: true },
      });

      // Create OrderItems + OrderItemComponents.
      for (const row of itemRows) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: created.id,
            productId: row.product.id,
            variantId: row.variant?.id ?? null,
            quantity: row.item.quantity,
            unitPrice: new Prisma.Decimal(row.unitPrice),
            totalPrice: new Prisma.Decimal(row.totalPrice),
            snapshot: buildOrderItemSnapshot(
              row.product,
              row.variant,
              row.item,
            ),
            substitutions:
              (row.item.substitutions as unknown as Prisma.InputJsonValue) ??
              Prisma.JsonNull,
            selectedPieces:
              (row.item.selectedPieces as unknown as Prisma.InputJsonValue) ??
              Prisma.JsonNull,
            extras:
              (row.item.extras as unknown as Prisma.InputJsonValue) ??
              Prisma.JsonNull,
            drinks:
              (row.item.drinks as unknown as Prisma.InputJsonValue) ??
              Prisma.JsonNull,
            notes: row.item.notes ?? null,
          },
          select: { id: true },
        });

        const components = buildOrderItemComponents(
          row.variant?.components,
          orderItem.id,
        );
        if (components.length > 0) {
          await tx.orderItemComponent.createMany({ data: components });
        }
      }

      // Audit only when paid (pending orders audit on /pay).
      if (dto.paymentStatus === 'PAID') {
        await this.auditService.log(tx, {
          entity: 'Order',
          entityId: created.id,
          action: 'CREATE_SALE',
          userId: actor.sub,
          shiftId: shift.id,
          details: {
            total: originalAmount,
            items: summarizeItems(
              itemRows.map((r) => ({
                productName: r.product.name,
                quantity: r.item.quantity,
                totalPrice: r.totalPrice,
              })),
            ),
            paymentMethod: dto.paymentMethod,
          },
        });
      }

      return created.id;
    });

    this.logger.log(`Pedido creado: ${order} por ${actor.email}`);

    return this.findById(order, actor);
  }

  async pay(orderId: string, dto: PayOrderDto, actor: JwtPayload) {
    const branchId = await this.resolveUserBranchId(actor.sub);

    const order = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          paymentStatus: true,
          status: true,
          total: true,
          shiftId: true,
          shift: { select: { branchId: true } },
        },
      });

      if (!existing) {
        throw new NotFoundException('Pedido no encontrado');
      }

      if (existing.shift.branchId !== branchId) {
        throw new ForbiddenException('No puede pagar pedidos de otra sucursal');
      }

      if (existing.paymentStatus === 'PAID') {
        throw new ConflictException({
          message: 'La orden ya está pagada',
          error: 'ORDER_ALREADY_PAID',
        });
      }

      if (existing.status === 'CANCELLED') {
        throw new ConflictException({
          message: 'La orden fue cancelada',
          error: 'ORDER_CANCELLED',
        });
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: dto.paymentMethod,
          paidAt: new Date(),
        },
        select: { id: true, total: true, shiftId: true },
      });

      await this.auditService.log(tx, {
        entity: 'Order',
        entityId: updated.id,
        action: 'CREATE_SALE',
        userId: actor.sub,
        shiftId: updated.shiftId,
        details: {
          orderId: updated.id,
          total:
            updated.total instanceof Prisma.Decimal
              ? updated.total.toNumber()
              : Number(updated.total),
          paymentMethod: dto.paymentMethod,
        },
      });

      return updated.id;
    });

    this.logger.log(`Pedido pagado: ${order} por ${actor.email}`);
    return this.findById(order, actor);
  }

  async cancel(orderId: string, actor: JwtPayload) {
    const branchId = await this.resolveUserBranchId(actor.sub);

    const order = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          paymentStatus: true,
          status: true,
          shiftId: true,
          shift: { select: { branchId: true } },
        },
      });

      if (!existing) {
        throw new NotFoundException('Pedido no encontrado');
      }

      if (existing.shift.branchId !== branchId) {
        throw new ForbiddenException(
          'No puede cancelar pedidos de otra sucursal',
        );
      }

      if (existing.paymentStatus === 'PAID') {
        throw new ConflictException({
          message:
            'La orden ya está pagada. La anulación con motivo llega en Sprint 2.',
          error: 'ORDER_ALREADY_PAID_USE_ANULL',
        });
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
        select: { id: true },
      });

      // Sprint 1: no CANCEL_SALE audit (cabled in Sprint 2 with paid-cancel + inventory revert).

      return updated.id;
    });

    this.logger.log(`Pedido cancelado: ${order} por ${actor.email}`);
    return this.findById(order, actor);
  }

  async findById(orderId: string, actor: JwtPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (
      actor.role !== UserRole.ADMIN &&
      actor.role !== UserRole.SUPER_ADMIN &&
      order.shift.branchId !== (await this.resolveUserBranchId(actor.sub))
    ) {
      throw new ForbiddenException(
        'No tiene acceso a pedidos de otra sucursal',
      );
    }

    return {
      isSuccess: true,
      message: 'Pedido obtenido correctamente',
      data: { order },
      error: null,
    };
  }

  async list(query: ListOrdersDto, actor: JwtPayload) {
    const where: Prisma.OrderWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      const dayStart = new Date(query.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.createdAt = { gte: dayStart, lt: dayEnd };
    }

    if (query.createdBy) {
      where.createdById = query.createdBy;
    }

    if (query.table) {
      where.tableNumber = query.table;
    }

    if (query.customer) {
      where.customerId = query.customer;
    }

    if (actor.role !== UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
      const branchId = await this.resolveUserBranchId(actor.sub);
      where.shift = { branchId };
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      isSuccess: true,
      message: 'Pedidos obtenidos correctamente',
      data: { orders, total },
      error: null,
    };
  }
}
