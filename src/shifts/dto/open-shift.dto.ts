import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Max, Min } from 'class-validator';

export class OpenShiftDto {
  @ApiProperty({ example: 200.0, minimum: 0, maximum: 999999.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  openingAmount!: number;

  @ApiProperty({ example: 'uuid-cash-register-1', format: 'uuid' })
  @IsUUID()
  cashRegisterId!: string;

  @ApiProperty({ example: 'uuid-period-manana', format: 'uuid' })
  @IsUUID()
  periodId!: string;
}
