import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { PaymentMethod } from '../../../generated/prisma/enums.js';

export class PayOrderDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsIn([PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.VALE])
  paymentMethod!: PaymentMethod;
}
