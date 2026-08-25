// Lógica central de bootstrap del SUPER_ADMIN.
// Se ejecuta DIRECTAMENTE contra la base de datos (Prisma), NO por HTTP.
// Idempotente: si el usuario ya existe, no hace nada.
// Las credenciales vienen de variables de entorno (SUPER_ADMIN_EMAIL /
// SUPER_ADMIN_FIRSTNAME / SUPER_ADMIN_LASTNAME / SUPER_ADMIN_CI) para datos
// reales; en desarrollo se usan los defaults.
// Login: email + CI (la contraseña hasheada es el CI).
import * as bcrypt from 'bcryptjs';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import { UserRole } from '../../../generated/prisma/enums.js';

export interface BootstrapResult {
  created: boolean;
  email: string;
}

export const SUPER_ADMIN_DEFAULTS = {
  firstName: 'Super',
  lastName: 'Admin',
  email: 'superadmin@wonderchicken.com',
  ci: '0000000',
};

/**
 * Crea el SUPER_ADMIN de bootstrap si no existe (idempotente).
 * - No pasa por la API: interactúa directo con Prisma.
 * - Si el usuario ya existe, no hace nada y devuelve created: false.
 * - Las credenciales se leen de SUPER_ADMIN_EMAIL / SUPER_ADMIN_FIRSTNAME /
 *   SUPER_ADMIN_LASTNAME / SUPER_ADMIN_CI del .env.
 * - El password almacenado en `passwordHash` es el hash del CI (mecanismo de auth).
 */
export async function bootstrapSuperAdmin(
  prisma: PrismaClient,
): Promise<BootstrapResult> {
  const email =
    process.env['SUPER_ADMIN_EMAIL'] ?? SUPER_ADMIN_DEFAULTS.email;
  const firstName =
    process.env['SUPER_ADMIN_FIRSTNAME'] ?? SUPER_ADMIN_DEFAULTS.firstName;
  const lastName =
    process.env['SUPER_ADMIN_LASTNAME'] ?? SUPER_ADMIN_DEFAULTS.lastName;
  const ci = process.env['SUPER_ADMIN_CI'] ?? SUPER_ADMIN_DEFAULTS.ci;

  const existing = await prisma.user.findFirst({ where: { email } });

  if (existing) {
    return { created: false, email };
  }

  const passwordHash = await bcrypt.hash(ci, 10);

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      ci,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      branchId: null,
      active: true,
    },
  });

  return { created: true, email };
}
