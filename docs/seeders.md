# Guía de Seeders — Poblar la base con datos de prueba

Funciones que llenan la base con datos de prueba realistas y coherentes con las
reglas de negocio. Viven en [`/seeders`](../seeders).

## Comandos

```bash
pnpm seed                 # wipe + seed completo (borra todo y repuebla en orden de FKs)
pnpm seed -- orders       # corre UN solo seeder (lee sus dependencias de la DB)
pnpm seed -- customers    # otro ejemplo
pnpm seed:reset           # solo vacía la base (no puebla)
pnpm seed -- --no-reset   # seed completo SIN borrar antes (modo append)
```

## Requisitos previos (una sola vez)

1. **Base de datos levantada** y `DATABASE_URL` configurada en `.env`.
2. **Tablas creadas**: `pnpm prisma db push` (sincroniza el schema con la DB).
3. **Cliente generado**: `pnpm prisma generate` (correr de nuevo tras cambiar el schema).

## Seeders disponibles (orden de dependencias)

`users` · `cash-registers` · `products` · `inventory` · `customers` · `discounts` ·
`shifts` · `discount-authorizations` · `orders` · `vouchers` ·
`inventory-transactions` · `daily-manual-consumptions` · `shift-chicken-logs` ·
`expenses` · `audit-logs`

> En modo puntual (`pnpm seed -- <nombre>`) el seeder **lee sus dependencias de la DB**.
> Si faltan (ej. correr `orders` sin turnos), falla con un mensaje claro: corré `pnpm seed` primero.

## Ajustar el volumen de datos

Editá la constante `VOLUME` en [`seeders/helpers.ts`](../seeders/helpers.ts)
(cantidad de cajeras, clientes, órdenes por turno, etc.).

## Datos reproducibles

El seeder usa una semilla fija de faker (`faker.seed(42)`), así que **cada corrida genera
los mismos datos**. Para datos distintos en cada corrida, quitá esa línea en `helpers.ts`.

## Agregar un seeder nuevo

1. Creá `seeders/domains/<dominio>.seeder.ts` exportando una función `seedX(prisma, ctx)`.
2. Registralo en [`seeders/index.ts`](../seeders/index.ts) en el orden de dependencias correcto.
3. Si otros seeders dependen de lo que creás, guardalo en el `SeedContext` con `apply`.

## Notas

- **Prisma 7**: el cliente exige un driver adapter (`@prisma/adapter-pg`). Ver
  [`seeders/prisma.ts`](../seeders/prisma.ts).
- El `wipe` borra en orden inverso de foreign keys (ver [`seeders/reset.ts`](../seeders/reset.ts)).
- Los datos respetan las reglas de negocio del schema: totales derivados, `orderNumber`
  por turno, `publicToken` único, transacciones de inventario al pagar, etc.
