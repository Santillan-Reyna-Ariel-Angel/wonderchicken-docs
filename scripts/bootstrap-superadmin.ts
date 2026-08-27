// Script de bootstrap del SUPER_ADMIN.
// Corre DIRECTAMENTE contra la BD (no por HTTP), creando el superadmin si no existe.
// Idempotente: si ya existe, no hace nada.
//
// Uso:
//   pnpm bootstrap:admin
//
// Credenciales desde variables de entorno (SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD / SUPER_ADMIN_CI),
// con defaults de desarrollo superadmin@wonderchicken.com/password123.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { bootstrapSuperAdmin } from '../src/common/bootstrap/super-admin.js';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('Falta DATABASE_URL en .env (lo requiere PrismaClient en Prisma 7).');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await bootstrapSuperAdmin(prisma);

  if (result.created) {
    console.log(`✅ SUPER_ADMIN "${result.email}" creado correctamente.`);
    console.log('   Login: email + CI (la contraseña es el CI definido en SUPER_ADMIN_CI del .env)');
  } else {
    console.log(
      `ℹ️  El usuario "${result.email}" ya existía. No se hizo nada (idempotente).`,
    );
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Error en el bootstrap del SUPER_ADMIN:', error);
  process.exit(1);
});