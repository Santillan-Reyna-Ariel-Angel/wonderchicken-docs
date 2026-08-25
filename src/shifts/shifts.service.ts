import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { OpenShiftDto } from './dto/open-shift.dto.js';
import type { JwtPayload } from '../common/guards/auth.guard.js';

const shiftPeriodSelect = {
  id: true,
  name: true,
  displayOrder: true,
  referenceStart: true,
  referenceEnd: true,
  active: true,
} as const;

const shiftWithRefsSelect = {
  id: true,
  status: true,
  openingAmount: true,
  lastOrderNumber: true,
  startAt: true,
  branchId: true,
  cashier: { select: { id: true, firstName: true, lastName: true } },
  cashRegister: { select: { id: true, name: true } },
  period: { select: { id: true, name: true, displayOrder: true } },
} as const;

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listPeriods() {
    const periods = await this.prisma.shiftPeriod.findMany({
      where: { active: true },
      select: shiftPeriodSelect,
      orderBy: { displayOrder: 'asc' },
    });

    return {
      isSuccess: true,
      message: 'Períodos de turno obtenidos correctamente',
      data: { periods },
      error: null,
    };
  }

  /**
   * Resolves the user's branchId from the User table. JwtPayload doesn't carry
   * branchId (Sprint 0), so we fetch it on demand. For SUPER_ADMIN the
   * branchId is null — they should not be opening POS shifts anyway, but we
   * reject if it's missing.
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

  async open(dto: OpenShiftDto, actor: JwtPayload) {
    const branchId = await this.resolveUserBranchId(actor.sub);

    const shift = await this.prisma.$transaction(async (tx) => {
      const period = await tx.shiftPeriod.findUnique({
        where: { id: dto.periodId },
        select: { id: true, active: true },
      });

      if (!period || !period.active) {
        throw new BadRequestException({
          message: 'El período de turno no existe o está inactivo',
          error: 'SHIFT_PERIOD_NOT_FOUND',
        });
      }

      const cashRegister = await tx.cashRegister.findUnique({
        where: { id: dto.cashRegisterId },
        select: { id: true, branchId: true, active: true },
      });

      if (
        !cashRegister ||
        !cashRegister.active ||
        cashRegister.branchId !== branchId
      ) {
        throw new BadRequestException({
          message: 'La caja no existe o no pertenece a su sucursal',
          error: 'CASH_REGISTER_NOT_FOUND',
        });
      }

      const created = await tx.shift.create({
        data: {
          status: 'OPEN',
          openingAmount: new Prisma.Decimal(dto.openingAmount),
          lastOrderNumber: 0,
          cashierId: actor.sub,
          cashRegisterId: cashRegister.id,
          branchId,
          periodId: period.id,
        },
        select: shiftWithRefsSelect,
      });

      await this.auditService.log(tx, {
        entity: 'Shift',
        entityId: created.id,
        action: 'OPEN_SHIFT',
        userId: actor.sub,
        shiftId: created.id,
        details: {
          openingAmount: dto.openingAmount,
          cashRegisterId: dto.cashRegisterId,
          periodId: dto.periodId,
        },
      });

      return created;
    });

    this.logger.log(`Turno abierto: ${shift.id} por ${actor.email}`);

    return {
      isSuccess: true,
      message: 'Caja abierta correctamente',
      data: { shift },
      error: null,
    };
  }

  async findActiveForUser(actor: JwtPayload) {
    const shift = await this.prisma.shift.findFirst({
      where: { cashierId: actor.sub, status: 'OPEN' },
      select: shiftWithRefsSelect,
      orderBy: { startAt: 'desc' },
    });

    if (!shift) {
      return null;
    }

    return shift;
  }

  async findActiveForUserOrThrow(actor: JwtPayload) {
    const shift = await this.findActiveForUser(actor);
    if (!shift) {
      throw new ConflictException({
        message:
          'No hay un turno abierto. Abra caja antes de registrar pedidos.',
        error: 'NO_ACTIVE_SHIFT',
      });
    }
    return shift;
  }

  async requireShiftForBranch(shiftId: string, branchId: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id: shiftId },
      select: { id: true, branchId: true, status: true, lastOrderNumber: true },
    });

    if (!shift) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (shift.branchId !== branchId) {
      throw new BadRequestException({
        message: 'El turno pertenece a otra sucursal',
        error: 'SHIFT_FROM_OTHER_BRANCH',
      });
    }

    return shift;
  }
}
