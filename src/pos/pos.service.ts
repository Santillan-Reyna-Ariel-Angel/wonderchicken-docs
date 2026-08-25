import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import type { JwtPayload } from '../common/guards/auth.guard.js';

@Injectable()
export class PosService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly shiftsService: ShiftsService,
  ) {}

  /**
   * Single-call context loader for the POS (tech guide §5.0 princ. 6).
   * Lightweight: only active catalog + active periods + (optionally) the
   * user's active shift. `shift` may be null — the client renders the
   * open-shift screen in that case (no error).
   *
   * Sprint 1: no `discounts`, no `piecePrices` (added in S3 / S2).
   */
  async getContext(actor: JwtPayload) {
    const [productsResult, periodsResult, shift] = await Promise.all([
      this.productsService.findAllForRole(actor.role),
      this.shiftsService.listPeriods(),
      this.shiftsService.findActiveForUser(actor),
    ]);

    return {
      isSuccess: true,
      message: 'Contexto POS',
      data: {
        products: productsResult.data.products,
        shiftPeriods: periodsResult.data.periods,
        shift,
      },
      error: null,
    };
  }
}
