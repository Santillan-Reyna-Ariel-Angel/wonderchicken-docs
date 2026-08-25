import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { ShiftsModule } from '../shifts/shifts.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [AuditModule, ShiftsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
