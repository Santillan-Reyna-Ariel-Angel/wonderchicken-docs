import { Prisma } from '../../../generated/prisma/client.js';

/**
 * Mapea errores de Prisma a respuestas HTTP amigables.
 *
 * Los errores de Prisma con código P2xxx son errores de DATOS del cliente
 * (violación de unicidad, FK inexistente, etc.) — NO son fallas del servidor.
 * Devolverlos como 500 sería incorrecto: el cliente mandó datos inválidos.
 *
 * Reutilizable: cualquier endpoint que use Prisma pasa por acá vía el
 * HttpExceptionFilter global.
 */

export interface PrismaErrorMapping {
  status: number;
  message: string;
  code: string;
}

const PRISMA_ERROR_MAP: Record<string, PrismaErrorMapping> = {
  // Violación de unicidad (ej. username duplicado)
  P2002: {
    status: 409,
    message: 'Ya existe un registro con esos datos',
    code: 'CONFLICT',
  },
  // Violación de clave foránea (ej. branchId inexistente)
  P2003: {
    status: 400,
    message: 'El registro referenciado no existe',
    code: 'BAD_REQUEST',
  },
  // Registro no encontrado para update/delete
  P2025: {
    status: 404,
    message: 'El registro no existe',
    code: 'NOT_FOUND',
  },
};

/**
 * Intenta mapear un error de Prisma a una respuesta HTTP.
 * Devuelve null si el error no es un PrismaClientKnownRequestError conocido.
 */
export function mapPrismaError(exception: unknown): PrismaErrorMapping | null {
  if (!(exception instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  const mapping = PRISMA_ERROR_MAP[exception.code];
  if (!mapping) {
    return null;
  }

  return mapping;
}
