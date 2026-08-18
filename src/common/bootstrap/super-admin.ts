// Lógica central de bootstrap del SUPER_ADMIN.
// Se ejecuta DIRECTAMENTE contra la base de datos (Prisma), NO por HTTP.
// Idempotente: si el usuario ya existe, no hace nada.
// Las credenciales vienen de variables de entorno (SUPER_ADMIN_USERNAME /
// SUPER_ADMIN_PASSWORD) para datos reales; en desarrollo se usan los defaults.
import * as bcrypt from 'bcryptjs';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import { UserRole } from '../../../generated/prisma/enums.js';

export interface BootstrapResult {
  created: boolean;
  username: string;
}

export const SUPER_ADMIN_DEFAULTS = {
  name: 'Super Admin',
  username: 'superadmin',
  password: 'password123',
};

/**
 * Crea el SUPER_ADMIN de bootstrap si no existe (idempotente).
 * - No pasa por la API: interactúa directo con Prisma.
 * - Si el usuario ya existe, no hace nada y devuelve created: false.
 * - Las credenciales se leen de `SUPER_ADMIN_USERNAME` / `SUPER_ADMIN_PASSWORD`.
 */
export async function bootstrapSuperAdmin(
  prisma: PrismaClient,
): Promise<BootstrapResult> {
  const username =
    process.env['SUPER_ADMIN_USERNAME'] ?? SUPER_ADMIN_DEFAULTS.username;
  const password =
    process.env['SUPER_ADMIN_PASSWORD'] ?? SUPER_ADMIN_DEFAULTS.password;

  const existing = await prisma.user.findUnique({ where: { username } });

  if (existing) {
    return { created: false, username };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: SUPER_ADMIN_DEFAULTS.name,
      username,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      branchId: null,
      active: true,
    },
  });

  return { created: true, username };
}
