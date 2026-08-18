import {
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma/enums.js';

export class CreateUserDto {
  @ApiProperty({ example: 'Roxana' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'roxana' })
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CASHIER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Sucursal asignada (null para SUPER_ADMIN)',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
