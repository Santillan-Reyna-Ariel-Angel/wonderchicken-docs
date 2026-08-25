// scripts/get-cash-register-id.js
// Ejecutar: node scripts/get-cash-register-id.js
// Muestra los cash registers disponibles para usar en los requests de la coleccion

import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient();

async function main() {
  const registers = await prisma.cashRegister.findMany({
    select: {
      id: true,
      name: true,
      branchId: true,
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log('\n📋 Cash Registers disponibles:\n');
  console.table(
    registers.map((r) => ({
      id: r.id,
      name: r.name,
      branch: r.branch.name,
    })),
  );

  if (registers.length > 0) {
    console.log(
      `\n✅ Usar este ID en la coleccion: ${registers[0].id}\n`,
    );
  } else {
    console.log('\n⚠️  No hay cash registers. Ejecutar: pnpm seed\n');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
