import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from '../../../generated/prisma/enums.js';
import { CreateOrderItemDto } from './create-order-item.dto.js';

export class CreateOrderDto {
  @ApiProperty({ enum: OrderType, example: OrderType.MESA })
  @IsIn([OrderType.MESA, OrderType.LLEVAR])
  type!: OrderType;

  @ApiProperty({
    example: '70',
    required: false,
    description: 'Requerido si type=MESA',
  })
  @IsOptional()
  tableNumber?: string;

  @ApiProperty({
    example: 'uuid-customer-001',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PAID })
  @IsIn([PaymentStatus.PAID, PaymentStatus.PENDING])
  paymentStatus!: PaymentStatus;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    required: false,
    description: 'Requerido si paymentStatus=PAID',
  })
  @IsOptional()
  @IsIn([PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.VALE])
  paymentMethod?: PaymentMethod;

  @ApiProperty({ type: CreateOrderItemDto, isArray: true, minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
