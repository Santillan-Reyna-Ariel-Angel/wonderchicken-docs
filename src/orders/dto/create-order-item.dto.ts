import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemSelectedPieceDto {
  @ApiProperty({
    example: 'pecho',
    enum: ['pecho', 'ala', 'pierna', 'entrepierna'],
  })
  @IsIn(['pecho', 'ala', 'pierna', 'entrepierna'])
  type!: 'pecho' | 'ala' | 'pierna' | 'entrepierna';

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  qty!: number;
}

export class OrderItemSubstitutionDto {
  @ApiProperty({ example: 'mixto', enum: ['mixto'] })
  @IsIn(['mixto'])
  from!: 'mixto';

  @ApiProperty({ example: 'arroz', enum: ['arroz', 'papa', 'smiles', 'mixto'] })
  @IsIn(['arroz', 'papa', 'smiles', 'mixto'])
  to!: 'arroz' | 'papa' | 'smiles' | 'mixto';
}

export class OrderItemExtraDto {
  @ApiProperty({ example: 'papa' })
  @IsString()
  type!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  qty!: number;
}

export class OrderItemDrinkDto {
  @ApiProperty({ example: 'uuid-product-fanta', format: 'uuid' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  qty!: number;
}

export class CreateOrderItemDto {
  @ApiProperty({ example: 'uuid-product-wonder', format: 'uuid' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({
    example: 'uuid-variant-wonder',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4')
  variantId?: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    type: OrderItemSelectedPieceDto,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemSelectedPieceDto)
  selectedPieces?: OrderItemSelectedPieceDto[];

  @ApiProperty({
    type: OrderItemSubstitutionDto,
    isArray: true,
    required: false,
    maxItems: 1,
    description: 'Máximo 1 por ítem. NO afecta el precio (PDR §2.1).',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemSubstitutionDto)
  substitutions?: OrderItemSubstitutionDto[];

  @ApiProperty({ type: OrderItemExtraDto, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemExtraDto)
  extras?: OrderItemExtraDto[];

  @ApiProperty({ type: OrderItemDrinkDto, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDrinkDto)
  drinks?: OrderItemDrinkDto[];

  @ApiProperty({ example: 'Sin sal', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
