import { randomBytes } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';

export interface VariantComponentLike {
  type: string;
  name?: string;
  count: number;
}

export interface OrderItemLike {
  productId: string;
  variantId?: string;
  quantity: number;
  selectedPieces?: Array<{ type: string; qty: number }>;
  substitutions?: Array<{ from: string; to: string }>;
  extras?: Array<{ type: string; qty: number }>;
  drinks?: Array<{ productId: string; qty: number }>;
}

/**
 * Generates a 128-bit hex publicToken used as capability URL credential
 * (PDR §2.8). 32 chars, non-guessable.
 */
export function generatePublicToken(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Atomically increments Shift.lastOrderNumber and returns the new value.
 * Must be called within a `$transaction` so the @@unique([shiftId, orderNumber])
 * constraint is enforced even under concurrency.
 */
export async function assignOrderNumber(
  tx: Prisma.TransactionClient,
  shiftId: string,
): Promise<number> {
  const updated = await tx.shift.update({
    where: { id: shiftId },
    data: { lastOrderNumber: { increment: 1 } },
    select: { lastOrderNumber: true },
  });
  return updated.lastOrderNumber;
}

/**
 * Builds the OrderItem.snapshot JSON — used for printing and audit.
 * Excludes derived fields (unitPrice, totalPrice) to avoid redundancy.
 */
export function buildOrderItemSnapshot(
  product: { name: string; basePrice: Prisma.Decimal | number },
  variant: { name: string; components: unknown } | null,
  item: OrderItemLike,
): Prisma.InputJsonValue {
  const basePrice =
    product.basePrice instanceof Prisma.Decimal
      ? product.basePrice.toNumber()
      : Number(product.basePrice);

  return {
    productName: product.name,
    productBasePrice: basePrice,
    variantName: variant?.name ?? null,
    variantComponents: variant?.components ?? null,
    quantity: item.quantity,
    selectedPieces: item.selectedPieces ?? [],
    substitutions: item.substitutions ?? [],
    extras: item.extras ?? [],
    drinks: item.drinks ?? [],
  };
}

/**
 * Builds OrderItemComponent rows from a variant's `components` JSON.
 * Sprint 1: only `type === 'presa'` is expanded into rows (each with its
 * `count` quantity). Bebidas/extras become components in Sprint 2 when
 * inventory catalog lands. Inventory decrement is NOT applied in Sprint 1 —
 * these rows are stored as a declarative reference for Sprint 2 to consume.
 */
export function buildOrderItemComponents(
  components: VariantComponentLike[] | unknown,
  orderItemId: string,
): Prisma.OrderItemComponentCreateManyInput[] {
  if (!Array.isArray(components)) {
    return [];
  }

  const rows: Prisma.OrderItemComponentCreateManyInput[] = [];

  for (const c of components) {
    if (c.type === 'presa') {
      rows.push({
        orderItemId,
        quantity: c.count,
        unitPrice: 0,
        label: c.name ?? c.type,
      });
    }
    // Other component types deferred to Sprint 2 (FR-006).
  }

  return rows;
}

/**
 * Aggregates item summaries for the AuditLog `details` JSON. Keeps the audit
 * payload compact and avoids dumping full snapshots.
 */
export function summarizeItems(
  items: Array<{
    productName: string;
    quantity: number;
    totalPrice: number | Prisma.Decimal;
  }>,
): Array<{ productName: string; quantity: number; totalPrice: number }> {
  return items.map((it) => {
    const totalPrice =
      it.totalPrice instanceof Prisma.Decimal
        ? it.totalPrice.toNumber()
        : Number(it.totalPrice);
    return {
      productName: it.productName,
      quantity: it.quantity,
      totalPrice,
    };
  });
}
