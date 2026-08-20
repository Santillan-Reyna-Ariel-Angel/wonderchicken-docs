import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma/enums.js';

/**
 * Query DTO para listar usuarios con filtro por rol.
 * Reutilizable y escalable: si a futuro se agregan más filtros
 * (active, branchId, búsqueda), se suman acá como propiedades opcionales.
 */
export class FindUsersQueryDto {
  @ApiPropertyOptional({ enum: UserRole, description: 'Filtrar por rol' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
