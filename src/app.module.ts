import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { AuditModule } from './audit/audit.module.js';
import { ProductsModule } from './products/products.module.js';
import { ShiftsModule } from './shifts/shifts.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PosModule } from './pos/pos.module.js';
import { AuthGuard } from './common/guards/auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    AuditModule,
    ProductsModule,
    ShiftsModule,
    OrdersModule,
    PosModule,
  ],
  providers: [
    // Orden importa: AuthGuard corre primero (autenticación), luego RolesGuard (autorización).
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
