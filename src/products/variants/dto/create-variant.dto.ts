import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class VariantComponentDto {
  @ApiProperty({
    example: 'presa',
    enum: ['presa', 'acompanamiento', 'bebida', 'extra'],
  })
  @IsIn(['presa', 'acompanamiento', 'bebida', 'extra'])
  type!: 'presa' | 'acompanamiento' | 'bebida' | 'extra';

  @ApiProperty({ example: 'mixto', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  count!: number;
}

export class CreateVariantDto {
  @ApiProperty({ example: 'uuid-product-porcion-media', format: 'uuid' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ example: 'Porción Media - Mixto' })
  @IsString()
  name!: string;

  @ApiProperty({ type: VariantComponentDto, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VariantComponentDto)
  components!: VariantComponentDto[];

  @ApiProperty({ example: true, required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
