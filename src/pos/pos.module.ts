import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module.js';
import { ShiftsModule } from '../shifts/shifts.module.js';
import { PosController } from './pos.controller.js';
import { PosService } from './pos.service.js';

@Module({
  imports: [ProductsModule, ShiftsModule],
  controllers: [PosController],
  providers: [PosService],
})
export class PosModule {}
