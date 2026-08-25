import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { OrderStatus } from '../../../generated/prisma/enums.js';

export class ListOrdersDto {
  @ApiProperty({ enum: OrderStatus, required: false })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiProperty({
    example: '2026-05-01',
    required: false,
    description: 'Fecha del día (ISO)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @ApiProperty({
    example: 'uuid-user-cashier',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4')
  createdBy?: string;

  @ApiProperty({ example: '70', required: false })
  @IsOptional()
  @IsString()
  table?: string;

  @ApiProperty({ example: 'uuid-customer', format: 'uuid', required: false })
  @IsOptional()
  @IsUUID('4')
  customer?: string;
}
