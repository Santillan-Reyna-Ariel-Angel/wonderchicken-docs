import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';

/**
 * Closed set of audited actions per tech guide §4.3.
 * Adding a new action requires updating this list AND the audit mapping table.
 */
export const AUDIT_ACTIONS = [
  'CREATE_SALE',
  'CANCEL_SALE',
  'ADJUST_INVENTORY',
  'CREATE_VOUCHER',
  'OPEN_SHIFT',
  'CLOSE_SHIFT',
  'GENERATE_REPORT',
  'AUTHORIZE_DISCOUNT',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditLogParams {
  entity: string;
  entityId: string;
  action: string;
  userId: string;
  shiftId?: string;
  details?: Prisma.InputJsonValue;
}

/**
 * Append-only audit service (tech guide §4.3).
 *
 * The single public method `log` must be called from within a Prisma
 * `$transaction` so the audit row is persisted atomically with the operation
 * it records. Never expose create/update/delete — the AuditLog table is
 * append-only and its immutability IS the feature.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async log(
    tx: Prisma.TransactionClient,
    params: AuditLogParams,
  ): Promise<void> {
    if (!AUDIT_ACTIONS.includes(params.action as AuditAction)) {
      throw new BadRequestException(
        `Acción de auditoría no soportada: ${params.action}`,
      );
    }

    await tx.auditLog.create({
      data: {
        entity: params.entity,
        entityId: params.entityId,
        action: params.action,
        userId: params.userId,
        shiftId: params.shiftId ?? null,
        details: params.details ?? Prisma.JsonNull,
      },
    });

    this.logger.debug(
      `audit ${params.action} entity=${params.entity}:${params.entityId} user=${params.userId}`,
    );
  }
}
