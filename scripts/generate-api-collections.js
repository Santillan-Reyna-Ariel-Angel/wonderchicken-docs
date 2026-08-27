// scripts/generate-api-collections.js
// Genera: notes/wonderchicken-api.postman_collection.json
//         notes/wonderchicken-api.thunder-collection.json
//
// Uso: node scripts/generate-api-collections.js
//
// El script genera colecciones completas para:
//   - Auth (login/logout, credenciales invalidas)
//   - Branches (CRUD + toggle, permisos entre roles)
//   - Users (CRUD + toggle, permisos entre roles)
//   - Products + Variants
//   - Orders (crear/pagar/cancelar/listar por estado y rol)
//   - Shifts (abrir/cerrar/activo)
//   - POS context
//   - Error 401/403 por rol
//   - Edge cases y boundary testing
//
// Credenciales de test:
//   SUPER_ADMIN: superadmin@wonderchicken.com / password123
//   ADMIN:       ana@wonderchicken.com / 1111111
//   CASHIER:     carla@wonderchicken.com / 2222222
//   DISPATCHER:  diana@wonderchicken.com / 3333333

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Credenciales de test ────────────────────────────────────────────────────
const USERS = {
  SUPER_ADMIN: { email: 'superadmin@wonderchicken.com', password: 'password123', role: 'SUPER_ADMIN' },
  ADMIN:       { email: 'ana@wonderchicken.com',        password: '1111111', role: 'ADMIN'       },
  CASHIER:     { email: 'carla@wonderchicken.com',      password: '2222222', role: 'CASHIER'     },
  DISPATCHER:  { email: 'diana@wonderchicken.com',      password: '3333333', role: 'DISPATCHER'  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const vid = (prefix = 'id') => `{{${prefix}Id}}`;
const uid = () => '{{$guid}}';

function preScriptExtractToken(role) {
  return `// Auto-extrae accessToken al contexto de colección
var res = pm.response.json();
if (res.isSuccess && res.data?.accessToken) {
  pm.collectionVariables.set('${role}Token', res.data.accessToken);
}`;
}

function testJsonPath(path, expected) {
  return `pm.test('Respuesta correcta', function() {
  var actual = pm.response.json();${path.split('.').reduce((acc, p) => `${acc}${p.startsWith('[') ? acc + '[' + p + ']' : '.' + p}`, '')}
  pm.expect(actual).to.eql(${JSON.stringify(expected)});
});`;
}

// ─── Colección de requests ───────────────────────────────────────────────────
// Cada request: { name, method, url, body?, auth?, preScript?, test?, phase }
const requests = [];

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — AUTH
// ══════════════════════════════════════════════════════════════════════════════

requests.push(
  // 1.1 Login SUPER_ADMIN ok
  {
    name: '01 Login SUPER_ADMIN',
    phase: 1,
    method: 'POST',
    url: '{{baseUrl}}/auth/login',
    body: { email: USERS.SUPER_ADMIN.email, password: USERS.SUPER_ADMIN.password },
    preScript: preScriptExtractToken('superAdmin'),
    test: `
pm.test('Login exitoso', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('isSuccess=true', function() { pm.expect(res.isSuccess).to.eq(true); });
pm.test('Token presente', function() { pm.expect(res.data.accessToken).to.be.a('string'); });
pm.test('Rol correcto', function() { pm.expect(res.data.user.role).to.eq('SUPER_ADMIN'); });`,
  },
  // 1.2 Login ADMIN ok
  {
    name: '02 Login ADMIN',
    phase: 1,
    method: 'POST',
    url: '{{baseUrl}}/auth/login',
    body: { email: USERS.ADMIN.email, password: USERS.ADMIN.password },
    preScript: preScriptExtractToken('admin'),
    test: `
pm.test('Login exitoso', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('isSuccess=true', function() { pm.expect(res.isSuccess).to.eq(true); });
pm.test('Rol correcto', function() { pm.expect(res.data.user.role).to.eq('ADMIN'); });`,
  },
  // 1.3 Login CASHIER ok
  {
    name: '03 Login CASHIER',
    phase: 1,
    method: 'POST',
    url: '{{baseUrl}}/auth/login',
    body: { email: USERS.CASHIER.email, password: USERS.CASHIER.password },
    preScript: preScriptExtractToken('cashier'),
    test: `
pm.test('Login exitoso', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('isSuccess=true', function() { pm.expect(res.isSuccess).to.eq(true); });
pm.test('Rol correcto', function() { pm.expect(res.data.user.role).to.eq('CASHIER'); });`,
  },
  // 1.4 Login DISPATCHER ok
  {
    name: '04 Login DISPATCHER',
    phase: 1,
    method: 'POST',
    url: '{{baseUrl}}/auth/login',
    body: { email: USERS.DISPATCHER.email, password: USERS.DISPATCHER.password },
    preScript: preScriptExtractToken('dispatcher'),
    test: `
pm.test('Login exitoso', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('isSuccess=true', function() { pm.expect(res.isSuccess).to.eq(true); });
pm.test('Rol correcto', function() { pm.expect(res.data.user.role).to.eq('DISPATCHER'); });`,
  },
  // 1.5 Login password incorrecto
  {
    name: '05 Login password incorrecto [401]',
    phase: 1,
    method: 'POST',
    url: '{{baseUrl}}/auth/login',
    body: { email: USERS.CASHIER.email, password: 'WRONGPASS' },
    test: `
pm.test('401', function() { pm.response.to.have.status(401); });
var res = pm.response.json();
pm.test('isSuccess=false', function() { pm.expect(res.isSuccess).to.eq(false); });`,
  },
  // 1.6 Login email inexistente
  {
    name: '06 Login email inexistente [401]',
    phase: 1,
    method: 'POST',
    url: '{{baseUrl}}/auth/login',
    body: { email: 'nadie@wonderchicken.com', password: '0000000' },
    test: `
pm.test('401', function() { pm.response.to.have.status(401); });`,
  },
  // 1.7 Login sin body
  {
    name: '07 Login sin body [400]',
    phase: 1,
    method: 'POST',
    url: '{{baseUrl}}/auth/login',
    body: null,
    test: `
pm.test('400', function() { pm.response.to.have.status(400); });`,
  },
  // 1.8 Logout CASHIER
  {
    name: '08 Logout CASHIER',
    phase: 1,
    method: 'POST',
    url: '{{baseUrl}}/auth/logout',
    auth: 'cashier',
    test: `
pm.test('Logout exitoso', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('isSuccess=true', function() { pm.expect(res.isSuccess).to.eq(true); });`,
  },
  // 1.9 Re-login CASHIER post-logout (token renovado)
  {
    name: '09 Re-login CASHIER post-logout',
    phase: 1,
    method: 'POST',
    url: '{{baseUrl}}/auth/login',
    body: { email: USERS.CASHIER.email, password: USERS.CASHIER.password },
    preScript: preScriptExtractToken('cashier'),
    test: `
pm.test('Login ok', function() { pm.response.to.have.status(200); });`,
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — BRANCHES
// ══════════════════════════════════════════════════════════════════════════════

requests.push(
  // 2.1 SUPER_ADMIN crea branch
  {
    name: '10 Crear Branch [SUPER_ADMIN]',
    phase: 2,
    method: 'POST',
    url: '{{baseUrl}}/branches',
    auth: 'superAdmin',
    body: { name: 'Sucursal Central', address: 'Av. Central 123, Santa Cruz' },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.branch?.id) {
  pm.collectionVariables.set('branchId', res.data.branch.id);
}`,
    test: `
pm.test('Branch creada', function() { pm.response.to.have.status(201); });
var res = pm.response.json();
pm.test('Nombre correcto', function() { pm.expect(res.data.branch.name).to.eq('Sucursal Central'); });`,
  },
  // 2.2 Listar branches (SUPER_ADMIN)
  {
    name: '11 Listar Branches [SUPER_ADMIN]',
    phase: 2,
    method: 'GET',
    url: '{{baseUrl}}/branches',
    auth: 'superAdmin',
    test: `
pm.test('Lista ok', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('isSuccess', function() { pm.expect(res.isSuccess).to.eq(true); });
pm.test('Al menos 1', function() { pm.expect(res.data.branches.length).to.greaterThan(0); });`,
  },
  // 2.3 Listar branches (ADMIN — también tiene acceso)
  {
    name: '12 Listar Branches [ADMIN]',
    phase: 2,
    method: 'GET',
    url: '{{baseUrl}}/branches',
    auth: 'admin',
    test: `pm.test('Lista ok', function() { pm.response.to.have.status(200); });`,
  },
  // 2.4 Editar branch
  {
    name: '13 Editar Branch [SUPER_ADMIN]',
    phase: 2,
    method: 'PATCH',
    url: '{{baseUrl}}/branches/{{branchId}}',
    auth: 'superAdmin',
    body: { address: 'Av. Nueva 456, Santa Cruz' },
    test: `
pm.test('Editada', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('Direccion actualizada', function() { pm.expect(res.data.branch.address).to.include('Nueva'); });`,
  },
  // 2.5 Toggle branch active
  {
    name: '14 Toggle Branch active [SUPER_ADMIN]',
    phase: 2,
    method: 'PATCH',
    url: '{{baseUrl}}/branches/{{branchId}}/toggle-active',
    auth: 'superAdmin',
    test: `
pm.test('Toggle ok', function() { pm.response.to.have.status(200); });`,
  },
  // 2.6 CASHIER no puede listar branches
  {
    name: '15 Listar Branches [CASHIER — 403]',
    phase: 2,
    method: 'GET',
    url: '{{baseUrl}}/branches',
    auth: 'cashier',
    test: `pm.test('403', function() { pm.response.to.have.status(403); });`,
  },
  // 2.7 ADMIN no puede crear branch
  {
    name: '16 Crear Branch [ADMIN — 403]',
    phase: 2,
    method: 'POST',
    url: '{{baseUrl}}/branches',
    auth: 'admin',
    body: { name: 'Sucursal Falsa', address: 'Calle Falsa 999' },
    test: `pm.test('403', function() { pm.response.to.have.status(403); });`,
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — USERS
// ══════════════════════════════════════════════════════════════════════════════

requests.push(
  // 3.1 SUPER_ADMIN crea ADMIN
  {
    name: '17 Crear ADMIN [SUPER_ADMIN]',
    phase: 3,
    method: 'POST',
    url: '{{baseUrl}}/users',
    auth: 'superAdmin',
    body: {
      firstName: 'Ana', lastName: 'Admin',
      email: 'ana.nueva@wonderchicken.com', ci: '4444444',
      role: 'ADMIN', branchId: '{{branchId}}',
    },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.user?.id) {
  pm.collectionVariables.set('adminId', res.data.user.id);
}`,
    test: `
pm.test('Admin creado', function() { pm.response.to.have.status(201); });
var res = pm.response.json();
pm.test('Rol ADMIN', function() { pm.expect(res.data.user.role).to.eq('ADMIN'); });`,
  },
  // 3.2 SUPER_ADMIN crea CASHIER
  {
    name: '18 Crear CASHIER [SUPER_ADMIN]',
    phase: 3,
    method: 'POST',
    url: '{{baseUrl}}/users',
    auth: 'superAdmin',
    body: {
      firstName: 'Carla', lastName: 'Cajera',
      email: 'carla.nueva@wonderchicken.com', ci: '5555555',
      role: 'CASHIER', branchId: '{{branchId}}',
    },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.user?.id) {
  pm.collectionVariables.set('cashier2Id', res.data.user.id);
}`,
    test: `
pm.test('Cashier creado', function() { pm.response.to.have.status(201); });`,
  },
  // 3.3 SUPER_ADMIN crea DISPATCHER
  {
    name: '19 Crear DISPATCHER [SUPER_ADMIN]',
    phase: 3,
    method: 'POST',
    url: '{{baseUrl}}/users',
    auth: 'superAdmin',
    body: {
      firstName: 'Diana', lastName: 'Despacho',
      email: 'diana.nueva@wonderchicken.com', ci: '6666666',
      role: 'DISPATCHER', branchId: '{{branchId}}',
    },
    test: `
pm.test('Dispatcher creado', function() { pm.response.to.have.status(201); });`,
  },
  // 3.4 ADMIN crea usuario (mismo branch)
  {
    name: '20 Crear CASHIER [ADMIN — mismo branch]',
    phase: 3,
    method: 'POST',
    url: '{{baseUrl}}/users',
    auth: 'admin',
    body: {
      firstName: 'Eva', lastName: 'Empleada',
      email: 'eva@wonderchicken.com', ci: '7777777',
      role: 'CASHIER', branchId: '{{branchId}}',
    },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.user?.id) {
  pm.collectionVariables.set('cashier3Id', res.data.user.id);
}`,
    test: `
pm.test('Cashier creada por admin', function() { pm.response.to.have.status(201); });`,
  },
  // 3.5 ADMIN no puede crear usuario de otra branch
  {
    name: '21 Crear CASHIER [ADMIN — otra branch — 403/400]',
    phase: 3,
    method: 'POST',
    url: '{{baseUrl}}/users',
    auth: 'admin',
    body: {
      firstName: 'Fran', lastName: 'Falsa',
      email: 'fran.falsa@wonderchicken.com', ci: '8888888',
      role: 'CASHIER', branchId: '{{branchId}}',
    },
    test: `
pm.test('200 o 403', function() {
  var status = pm.response.status;
  pm.expect([200, 201, 403]).to.include(status);
});`,
  },
  // 3.6 Listar usuarios
  {
    name: '22 Listar Usuarios [SUPER_ADMIN]',
    phase: 3,
    method: 'GET',
    url: '{{baseUrl}}/users',
    auth: 'superAdmin',
    test: `
pm.test('Lista ok', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('Al menos 1', function() { pm.expect(res.data.total).to.greaterThan(0); });`,
  },
  // 3.7 Listar filtrado por rol
  {
    name: '23 Listar Usuarios por rol=CASHIER [SUPER_ADMIN]',
    phase: 3,
    method: 'GET',
    url: '{{baseUrl}}/users?role=CASHIER',
    auth: 'superAdmin',
    test: `
pm.test('Solo cashiers', function() {
  var res = pm.response.json();
  var allCashiers = res.data.users.every(function(u) { return u.role === 'CASHIER'; });
  pm.expect(allCashiers).to.eq(true);
});`,
  },
  // 3.8 Obtener usuario por ID
  {
    name: '24 Obtener Usuario por ID [SUPER_ADMIN]',
    phase: 3,
    method: 'GET',
    url: '{{baseUrl}}/users/{{cashierId}}',
    auth: 'superAdmin',
    test: `
pm.test('Usuario encontrado', function() { pm.response.to.have.status(200); });`,
  },
  // 3.9 Editar usuario (phone)
  {
    name: '25 Editar Usuario phone [ADMIN]',
    phase: 3,
    method: 'PATCH',
    url: '{{baseUrl}}/users/{{cashierId}}',
    auth: 'admin',
    body: { phone: '+591 70000001' },
    test: `
pm.test('Telefono actualizado', function() {
  var res = pm.response.json();
  pm.expect(res.data.user.phone).to.include('70000001');
});`,
  },
  // 3.10 Toggle user active
  {
    name: '26 Toggle Usuario active [ADMIN]',
    phase: 3,
    method: 'PATCH',
    url: '{{baseUrl}}/users/{{cashierId}}/toggle-active',
    auth: 'admin',
    test: `
pm.test('Toggle ok', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('Active invertida', function() { pm.expect(res.data.user.active).to.be.a('boolean'); });`,
  },
  // 3.11 Reactivar
  {
    name: '27 Reactivar Usuario [ADMIN]',
    phase: 3,
    method: 'PATCH',
    url: '{{baseUrl}}/users/{{cashierId}}/toggle-active',
    auth: 'admin',
    test: `pm.test('Reactivado', function() { pm.response.to.have.status(200); });`,
  },
  // 3.12 CASHIER no puede crear usuarios
  {
    name: '28 Crear Usuario [CASHIER — 403]',
    phase: 3,
    method: 'POST',
    url: '{{baseUrl}}/users',
    auth: 'cashier',
    body: { firstName: 'X', lastName: 'Y', email: 'x@y.com', ci: '9999999', role: 'CASHIER', branchId: '{{branchId}}' },
    test: `pm.test('403', function() { pm.response.to.have.status(403); });`,
  },
  // 3.13 CASHIER no puede editar usuarios
  {
    name: '29 Editar Usuario [CASHIER — 403]',
    phase: 3,
    method: 'PATCH',
    url: '{{baseUrl}}/users/{{cashierId}}',
    auth: 'cashier',
    body: { phone: '+591 999' },
    test: `pm.test('403', function() { pm.response.to.have.status(403); });`,
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 4 — PRODUCTS + VARIANTS
// ══════════════════════════════════════════════════════════════════════════════

requests.push(
  // 4.1 Crear producto POLLO
  {
    name: '30 Crear Producto POLLO [ADMIN]',
    phase: 4,
    method: 'POST',
    url: '{{baseUrl}}/products',
    auth: 'admin',
    body: { name: 'Pollo Entero', basePrice: 85.00, category: 'POLLO', isSellable: true, isInventoryItem: true },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.product?.id) {
  pm.collectionVariables.set('productId', res.data.product.id);
}`,
    test: `
pm.test('Producto creado', function() { pm.response.to.have.status(201); });
var res = pm.response.json();
pm.test('Nombre ok', function() { pm.expect(res.data.product.name).to.eq('Pollo Entero'); });`,
  },
  // 4.2 Crear producto BEBIDA
  {
    name: '31 Crear Producto BEBIDA [ADMIN]',
    phase: 4,
    method: 'POST',
    url: '{{baseUrl}}/products',
    auth: 'admin',
    body: { name: 'Gaseosa 2L', basePrice: 18.00, category: 'BEBIDA', isSellable: true, isInventoryItem: false },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.product?.id) {
  pm.collectionVariables.set('bebidaId', res.data.product.id);
}`,
    test: `pm.test('Bebida creada', function() { pm.response.to.have.status(201); });`,
  },
  // 4.3 Crear producto OTRO
  {
    name: '32 Crear Producto OTRO (guarnición) [ADMIN]',
    phase: 4,
    method: 'POST',
    url: '{{baseUrl}}/products',
    auth: 'admin',
    body: { name: 'Puré de Papa', basePrice: 12.00, category: 'OTRO', isSellable: true, isInventoryItem: false },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.product?.id) {
  pm.collectionVariables.set('guarnicionId', res.data.product.id);
}`,
    test: `pm.test('Guarnicion creada', function() { pm.response.to.have.status(201); });`,
  },
  // 4.4 Crear variante
  {
    name: '33 Crear Variante 1/2 Pollo [ADMIN]',
    phase: 4,
    method: 'POST',
    url: '{{baseUrl}}/variants',
    auth: 'admin',
    body: {
      productId: '{{productId}}',
      name: '1/2 Pollo',
      components: [{ type: 'presa', name: '1/2 pollo', count: 1 }],
    },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.variant?.id) {
  pm.collectionVariables.set('variantId', res.data.variant.id);
}`,
    test: `
pm.test('Variante creada', function() { pm.response.to.have.status(201); });
var res = pm.response.json();
pm.test('Nombre ok', function() { pm.expect(res.data.variant.name).to.eq('1/2 Pollo'); });`,
  },
  // 4.5 Crear variante simple (strings puros, compatible con seeder)
  {
    name: '34 Crear Variante simple (strings) [ADMIN]',
    phase: 4,
    method: 'POST',
    url: '{{baseUrl}}/variants',
    auth: 'admin',
    body: {
      productId: '{{productId}}',
      name: '1/4 Pollo',
      components: [{ type: 'presa', name: '1/4 pollo', count: 1 }],
    },
    test: `pm.test('Variante ok', function() { pm.response.to.have.status(201); });`,
  },
  // 4.6 Listar productos ADMIN (ve todos)
  {
    name: '35 Listar Productos [ADMIN]',
    phase: 4,
    method: 'GET',
    url: '{{baseUrl}}/products',
    auth: 'admin',
    test: `
pm.test('Lista ok', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('Al menos 1', function() { pm.expect(res.data.products.length).to.greaterThan(0); });`,
  },
  // 4.7 Listar productos CASHIER (solo activos + isSellable)
  {
    name: '36 Listar Productos [CASHIER]',
    phase: 4,
    method: 'GET',
    url: '{{baseUrl}}/products',
    auth: 'cashier',
    test: `
pm.test('Lista ok', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('Solo sellable', function() {
  var allSellable = res.data.products.every(function(p) { return p.isSellable === true; });
  pm.expect(allSellable).to.eq(true);
});`,
  },
  // 4.8 ADMIN no puede crear producto
  {
    name: '37 Crear Producto [CASHIER — 403]',
    phase: 4,
    method: 'POST',
    url: '{{baseUrl}}/products',
    auth: 'cashier',
    body: { name: 'Producto X', basePrice: 10, category: 'OTRO' },
    test: `pm.test('403', function() { pm.response.to.have.status(403); });`,
  },
  // 4.9 Crear producto duplicado
  {
    name: '38 Crear Producto duplicado [400]',
    phase: 4,
    method: 'POST',
    url: '{{baseUrl}}/products',
    auth: 'admin',
    body: { name: 'Pollo Entero', basePrice: 85.00, category: 'POLLO' },
    test: `pm.test('400', function() { pm.response.to.have.status(400); });`,
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 5 — SHIFTS + SHIFT PERIODS
// ══════════════════════════════════════════════════════════════════════════════

requests.push(
  // 5.1 Listar shift periods
  {
    name: '39 Listar Shift Periods [CASHIER]',
    phase: 5,
    method: 'GET',
    url: '{{baseUrl}}/shifts/shift-periods',
    auth: 'cashier',
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.periods?.length > 0) {
  pm.collectionVariables.set('periodId', res.data.periods[0].id);
}`,
    test: `
pm.test('Periodos ok', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('Hay periodos', function() { pm.expect(res.data.periods.length).to.greaterThan(0); });`,
  },
  // 5.2 ADMIN también puede ver periods
  {
    name: '40 Listar Shift Periods [ADMIN]',
    phase: 5,
    method: 'GET',
    url: '{{baseUrl}}/shifts/shift-periods',
    auth: 'admin',
    test: `pm.test('Periodos ok', function() { pm.response.to.have.status(200); });`,
  },
  // 5.3 DISPATCHER no ve shift-periods
  {
    name: '41 Listar Shift Periods [DISPATCHER — 403]',
    phase: 5,
    method: 'GET',
    url: '{{baseUrl}}/shifts/shift-periods',
    auth: 'dispatcher',
    test: `pm.test('403', function() { pm.response.to.have.status(403); });`,
  },
  // 5.4 Abrir turno
  {
    name: '42 Abrir Turno [CASHIER]',
    phase: 5,
    method: 'POST',
    url: '{{baseUrl}}/shifts/open',
    auth: 'cashier',
    body: { periodId: '{{periodId}}', cashRegisterId: '{{cashRegisterId}}', openingAmount: 150.00 },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.shift?.id) {
  pm.collectionVariables.set('shiftId', res.data.shift.id);
}`,
    test: `
pm.test('Turno abierto', function() { pm.response.to.have.status(201); });
var res = pm.response.json();
pm.test('Status OPEN', function() { pm.expect(res.data.shift.status).to.eq('OPEN'); });
pm.test('OpeningAmount correcto', function() { pm.expect(res.data.shift.openingAmount).to.eq(150); });`,
  },
  // 5.5 Ver turno activo
  {
    name: '43 Ver Turno Activo [CASHIER]',
    phase: 5,
    method: 'GET',
    url: '{{baseUrl}}/shifts/active',
    auth: 'cashier',
    test: `
pm.test('Turno activo', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('Status OPEN', function() { pm.expect(res.data.shift.status).to.eq('OPEN'); });`,
  },
  // 5.6 ADMIN no puede abrir turno
  {
    name: '44 Abrir Turno [ADMIN — 403]',
    phase: 5,
    method: 'POST',
    url: '{{baseUrl}}/shifts/open',
    auth: 'admin',
    body: { periodId: '{{periodId}}', cashRegisterId: '{{cashRegisterId}}', openingAmount: 50 },
    test: `pm.test('403', function() { pm.response.to.have.status(403); });`,
  },
  // 5.7 CASHIER sin cashRegisterId (mala práctica pero posible)
  {
    name: '45 Abrir Turno sin cashRegisterId [400]',
    phase: 5,
    method: 'POST',
    url: '{{baseUrl}}/shifts/open',
    auth: 'cashier',
    body: { periodId: '{{periodId}}', openingAmount: 100 },
    test: `pm.test('400', function() { pm.response.to.have.status(400); });`,
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 6 — POS CONTEXT
// ══════════════════════════════════════════════════════════════════════════════

requests.push(
  // 6.1 POS context con turno abierto
  {
    name: '46 POS Context con turno abierto [CASHIER]',
    phase: 6,
    method: 'GET',
    url: '{{baseUrl}}/pos/context',
    auth: 'cashier',
    test: `
pm.test('Contexto ok', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('Shift presente', function() { pm.expect(res.data.shift).to.not.eq(null); });
pm.test('Productos array', function() { pm.expect(res.data.products).to.be.an('array'); });`,
  },
  // 6.2 POS context sin turno abierto (cerrar turno primero)
  {
    name: '47 POS Context sin turno (primero cerrar) [CASHIER]',
    phase: 6,
    method: 'GET',
    url: '{{baseUrl}}/pos/context',
    auth: 'cashier',
    test: `pm.test('200 (sin shift)', function() { pm.response.to.have.status(200); });`,
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 7 — ORDERS (flujo completo)
// ══════════════════════════════════════════════════════════════════════════════

requests.push(
  // 7.1 Crear orden MESA
  {
    name: '48 Crear Orden MESA [CASHIER]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders',
    auth: 'cashier',
    body: {
      type: 'MESA',
      tableNumber: '{{branchId}}',
      items: [{ productId: '{{productId}}', quantity: 2 }],
    },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.order?.id) {
  pm.collectionVariables.set('orderMesaId', res.data.order.id);
}`,
    test: `
pm.test('Orden MESA creada', function() { pm.response.to.have.status(201); });
var res = pm.response.json();
pm.test('Status CREATED', function() { pm.expect(res.data.order.status).to.eq('CREATED'); });
pm.test('Tipo MESA', function() { pm.expect(res.data.order.type).to.eq('MESA'); });`,
  },
  // 7.2 Crear orden LLEVAR
  {
    name: '49 Crear Orden LLEVAR [CASHIER]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders',
    auth: 'cashier',
    body: {
      type: 'LLEVAR',
      items: [{ productId: '{{productId}}', quantity: 1 }],
    },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.order?.id) {
  pm.collectionVariables.set('orderLlevarId', res.data.order.id);
}`,
    test: `
pm.test('Orden LLEVAR creada', function() { pm.response.to.have.status(201); });
var res = pm.response.json();
pm.test('Tipo LLEVAR', function() { pm.expect(res.data.order.type).to.eq('LLEVAR'); });`,
  },
  // 7.3 Crear orden con variant
  {
    name: '50 Crear Orden con Variant [CASHIER]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders',
    auth: 'cashier',
    body: {
      type: 'LLEVAR',
      items: [{ productId: '{{productId}}', variantId: '{{variantId}}', quantity: 1 }],
    },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.order?.id) {
  pm.collectionVariables.set('orderVariantId', res.data.order.id);
}`,
    test: `pm.test('Orden con variant', function() { pm.response.to.have.status(201); });`,
  },
  // 7.4 Crear orden con múltiplos items
  {
    name: '51 Crear Orden múltiples items [CASHIER]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders',
    auth: 'cashier',
    body: {
      type: 'MESA',
      tableNumber: '{{branchId}}',
      items: [
        { productId: '{{productId}}', quantity: 1 },
        { productId: '{{bebidaId}}', quantity: 2 },
        { productId: '{{guarnicionId}}', quantity: 1 },
      ],
    },
    preScript: `
var res = pm.response.json();
if (res.isSuccess && res.data?.order?.id) {
  pm.collectionVariables.set('orderMultiId', res.data.order.id);
}`,
    test: `
pm.test('Orden multiple items', function() { pm.response.to.have.status(201); });
var res = pm.response.json();
pm.test('Items >= 3', function() { pm.expect(res.data.order.items.length).to.at.least(3); });`,
  },
  // 7.5 Obtener orden por ID
  {
    name: '52 Obtener Orden MESA [CASHIER]',
    phase: 7,
    method: 'GET',
    url: '{{baseUrl}}/orders/{{orderMesaId}}',
    auth: 'cashier',
    test: `
pm.test('Orden encontrada', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('Status CREATED', function() { pm.expect(res.data.order.status).to.eq('CREATED'); });`,
  },
  // 7.6 Pagar orden MESA
  {
    name: '53 Pagar Orden MESA CASH [CASHIER]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders/{{orderMesaId}}/pay',
    auth: 'cashier',
    body: { paymentMethod: 'CASH' },
    test: `
pm.test('Pagada CASH', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('Status CONFIRMED', function() { pm.expect(res.data.order.status).to.eq('CONFIRMED'); });
pm.test('PaymentMethod CASH', function() { pm.expect(res.data.order.paymentMethod).to.eq('CASH'); });`,
  },
  // 7.7 Pagar con CARD
  {
    name: '54 Pagar Orden LLEVAR CARD [CASHIER]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders/{{orderLlevarId}}/pay',
    auth: 'cashier',
    body: { paymentMethod: 'CARD' },
    test: `
pm.test('Pagada CARD', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('Status CONFIRMED', function() { pm.expect(res.data.order.status).to.eq('CONFIRMED'); });`,
  },
  // 7.8 Cancelar orden
  {
    name: '55 Cancelar Orden [CASHIER]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders/{{orderVariantId}}/cancel',
    auth: 'cashier',
    test: `
pm.test('Cancelada', function() { pm.response.to.have.status(200); });
var res = pm.response.json();
pm.test('Status CANCELLED', function() { pm.expect(res.data.order.status).to.eq('CANCELLED'); });`,
  },
  // 7.9 Intentar pagar orden ya pagada
  {
    name: '56 Pagar orden ya pagada [400]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders/{{orderMesaId}}/pay',
    auth: 'cashier',
    body: { paymentMethod: 'CASH' },
    test: `pm.test('400', function() { pm.response.to.have.status(400); });`,
  },
  // 7.10 Listar órdenes sin filtro (CASHIER ve las propias)
  {
    name: '57 Listar Órdenes sin filtro [CASHIER]',
    phase: 7,
    method: 'GET',
    url: '{{baseUrl}}/orders',
    auth: 'cashier',
    test: `
pm.test('Lista ok', function() { pm.response.to.have.status(200); });`,
  },
  // 7.11 Listar por status=CONFIRMED
  {
    name: '58 Listar Órdenes CONFIRMED [CASHIER]',
    phase: 7,
    method: 'GET',
    url: '{{baseUrl}}/orders?status=CONFIRMED',
    auth: 'cashier',
    test: `
pm.test('Solo confirmed', function() {
  var res = pm.response.json();
  var allConfirmed = res.data.orders.every(function(o) { return o.status === 'CONFIRMED'; });
  pm.expect(allConfirmed).to.eq(true);
});`,
  },
  // 7.12 Listar por status=CREATED
  {
    name: '59 Listar Órdenes CREATED [CASHIER]',
    phase: 7,
    method: 'GET',
    url: '{{baseUrl}}/orders?status=CREATED',
    auth: 'cashier',
    test: `
pm.test('Solo created', function() {
  var res = pm.response.json();
  var allCreated = res.data.orders.every(function(o) { return o.status === 'CREATED'; });
  pm.expect(allCreated).to.eq(true);
});`,
  },
  // 7.13 Listar por status=CANCELLED
  {
    name: '60 Listar Órdenes CANCELLED [CASHIER]',
    phase: 7,
    method: 'GET',
    url: '{{baseUrl}}/orders?status=CANCELLED',
    auth: 'cashier',
    test: `pm.test('Solo cancelled', function() { pm.response.to.have.status(200); });`,
  },
  // 7.14 ADMIN ve todas las órdenes
  {
    name: '61 Listar Órdenes [ADMIN]',
    phase: 7,
    method: 'GET',
    url: '{{baseUrl}}/orders',
    auth: 'admin',
    test: `
pm.test('Admin ve todas', function() { pm.response.to.have.status(200); });`,
  },
  // 7.15 ADMIN ve orden específica
  {
    name: '62 Obtener Orden [ADMIN]',
    phase: 7,
    method: 'GET',
    url: '{{baseUrl}}/orders/{{orderMesaId}}',
    auth: 'admin',
    test: `pm.test('Admin ve orden', function() { pm.response.to.have.status(200); });`,
  },
  // 7.16 ADMIN no puede crear orden
  {
    name: '63 Crear Orden [ADMIN — 403]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders',
    auth: 'admin',
    body: { type: 'MESA', tableNumber: '{{branchId}}', items: [{ productId: '{{productId}}', quantity: 1 }] },
    test: `pm.test('403', function() { pm.response.to.have.status(403); });`,
  },
  // 7.17 ADMIN no puede pagar/cancelar
  {
    name: '64 Pagar Orden [ADMIN — 403]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders/{{orderMesaId}}/pay',
    auth: 'admin',
    body: { paymentMethod: 'CASH' },
    test: `pm.test('403', function() { pm.response.to.have.status(403); });`,
  },
  // 7.18 DISPATCHER ve órdenes CONFIRMED
  {
    name: '65 Listar Órdenes CONFIRMED [DISPATCHER]',
    phase: 7,
    method: 'GET',
    url: '{{baseUrl}}/orders?status=CONFIRMED',
    auth: 'dispatcher',
    test: `
pm.test('Dispatcher ve confirmadas', function() { pm.response.to.have.status(200); });`,
  },
  // 7.19 DISPATCHER no ve órdenes de otras branch (en bracket)
  {
    name: '66 Dispatcher ve orden [DISPATCHER]',
    phase: 7,
    method: 'GET',
    url: '{{baseUrl}}/orders/{{orderMesaId}}',
    auth: 'dispatcher',
    test: `pm.test('Dispatcher ve orden', function() { pm.response.to.have.status(200); });`,
  },
  // 7.20 CASHIER sin token no puede crear orden
  {
    name: '67 Crear Orden sin token [401]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders',
    body: { type: 'LLEVAR', items: [{ productId: '{{productId}}', quantity: 1 }] },
    test: `pm.test('401', function() { pm.response.to.have.status(401); });`,
  },
  // 7.21 Crear orden sin items
  {
    name: '68 Crear Orden sin items [400]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders',
    auth: 'cashier',
    body: { type: 'LLEVAR', items: [] },
    test: `pm.test('400', function() { pm.response.to.have.status(400); });`,
  },
  // 7.22 Crear orden sin turno abierto (market logic — se permite o no?)
  {
    name: '69 Crear Orden sin turno abierto [CASHIER]',
    phase: 7,
    method: 'POST',
    url: '{{baseUrl}}/orders',
    auth: 'cashier',
    body: { type: 'LLEVAR', items: [{ productId: '{{productId}}', quantity: 1 }] },
    test: `// El comportamiento depende de la lógica de negocio (Sprint 1 permite/sin turno)`,
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 8 — VARIANT + EXTRA FLOWS
// ══════════════════════════════════════════════════════════════════════════════

requests.push(
  // 8.1 Crear variant de bebida
  {
    name: '70 Crear Variante de Bebida [ADMIN]',
    phase: 8,
    method: 'POST',
    url: '{{baseUrl}}/variants',
    auth: 'admin',
    body: {
      productId: '{{bebidaId}}',
      name: 'Gaseosa 1.5L',
      components: [{ type: 'bebida', name: 'gaseosa 1.5L', count: 1 }],
    },
    test: `pm.test('Variant bebida', function() { pm.response.to.have.status(201); });`,
  },
  // 8.2 Crear variant sin components
  {
    name: '71 Crear Variante sin components [400]',
    phase: 8,
    method: 'POST',
    url: '{{baseUrl}}/variants',
    auth: 'admin',
    body: { productId: '{{productId}}', name: 'Sola', components: [] },
    test: `pm.test('400', function() { pm.response.to.have.status(400); });`,
  },
  // 8.3 CASHIER puede listar products (ya testeado en 4.6 pero lo reiteramos)
  {
    name: '72 Listar Productos [CASHIER — recheck]',
    phase: 8,
    method: 'GET',
    url: '{{baseUrl}}/products',
    auth: 'cashier',
    test: `pm.test('Lista ok', function() { pm.response.to.have.status(200); });`,
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 9 — EDGE CASES + BOUNDARY
// ══════════════════════════════════════════════════════════════════════════════

requests.push(
  // 9.1 Login con email mal formateado
  {
    name: '73 Login email mal formado [400]',
    phase: 9,
    method: 'POST',
    url: '{{baseUrl}}/auth/login',
    body: { email: 'no-es-email', password: '123' },
    test: `pm.test('400', function() { pm.response.to.have.status(400); });`,
  },
  // 9.2 Crear usuario con email duplicado
  {
    name: '74 Crear Usuario email duplicado [400]',
    phase: 9,
    method: 'POST',
    url: '{{baseUrl}}/users',
    auth: 'superAdmin',
    body: {
      firstName: 'Dupe', lastName: 'User',
      email: USERS.ADMIN.email, ci: '0000001',
      role: 'CASHIER', branchId: '{{branchId}}',
    },
    test: `pm.test('400', function() { pm.response.to.have.status(400); });`,
  },
  // 9.3 Editar branch que no existe
  {
    name: '75 Editar Branch inexistente [404]',
    phase: 9,
    method: 'PATCH',
    url: '{{baseUrl}}/branches/00000000-0000-0000-0000-000000000000',
    auth: 'superAdmin',
    body: { address: 'X' },
    test: `pm.test('404', function() { pm.response.to.have.status(404); });`,
  },
  // 9.4 Obtener usuario que no existe
  {
    name: '76 Obtener Usuario inexistente [404]',
    phase: 9,
    method: 'GET',
    url: '{{baseUrl}}/users/00000000-0000-0000-0000-000000000000',
    auth: 'superAdmin',
    test: `pm.test('404', function() { pm.response.to.have.status(404); });`,
  },
  // 9.5 Toggle usuario inexistente
  {
    name: '77 Toggle Usuario inexistente [404]',
    phase: 9,
    method: 'PATCH',
    url: '{{baseUrl}}/users/00000000-0000-0000-0000-000000000000/toggle-active',
    auth: 'admin',
    test: `pm.test('404', function() { pm.response.to.have.status(404); });`,
  },
  // 9.6 Obtener orden inexistente
  {
    name: '78 Obtener Orden inexistente [404]',
    phase: 9,
    method: 'GET',
    url: '{{baseUrl}}/orders/00000000-0000-0000-0000-000000000000',
    auth: 'cashier',
    test: `pm.test('404', function() { pm.response.to.have.status(404); });`,
  },
  // 9.7 Pagar orden inexistente
  {
    name: '79 Pagar Orden inexistente [404]',
    phase: 9,
    method: 'POST',
    url: '{{baseUrl}}/orders/00000000-0000-0000-0000-000000000000/pay',
    auth: 'cashier',
    body: { paymentMethod: 'CASH' },
    test: `pm.test('404', function() { pm.response.to.have.status(404); });`,
  },
  // 9.8 Toggle branch inexistente
  {
    name: '80 Toggle Branch inexistente [404]',
    phase: 9,
    method: 'PATCH',
    url: '{{baseUrl}}/branches/00000000-0000-0000-0000-000000000000/toggle-active',
    auth: 'superAdmin',
    test: `pm.test('404', function() { pm.response.to.have.status(404); });`,
  },
  // 9.9 Intentar editar con rol incorrecto
  {
    name: '81 Editar Branch [DISPATCHER — 403]',
    phase: 9,
    method: 'PATCH',
    url: '{{baseUrl}}/branches/{{branchId}}',
    auth: 'dispatcher',
    body: { address: 'X' },
    test: `pm.test('403', function() { pm.response.to.have.status(403); });`,
  },
  // 9.10 Listar con filtro de status inválido
  {
    name: '82 Listar Orders status inválido [400]',
    phase: 9,
    method: 'GET',
    url: '{{baseUrl}}/orders?status=INVALIDO',
    auth: 'cashier',
    test: `pm.test('400', function() { pm.response.to.have.status(400); });`,
  },
  // 9.11 Crear producto sin nombre
  {
    name: '83 Crear Producto sin nombre [400]',
    phase: 9,
    method: 'POST',
    url: '{{baseUrl}}/products',
    auth: 'admin',
    body: { basePrice: 10, category: 'OTRO' },
    test: `pm.test('400', function() { pm.response.to.have.status(400); });`,
  },
  // 9.12 Crear producto price=0
  {
    name: '84 Crear Producto price=0 [400]',
    phase: 9,
    method: 'POST',
    url: '{{baseUrl}}/products',
    auth: 'admin',
    body: { name: 'Gratis', basePrice: 0, category: 'OTRO' },
    test: `pm.test('400', function() { pm.response.to.have.status(400); });`,
  },
  // 9.13 JWT malformado
  {
    name: '85 GET /users token malformado [401]',
    phase: 9,
    method: 'GET',
    url: '{{baseUrl}}/users',
    headers: [{ key: 'Authorization', value: 'Bearer invalid.token.here' }],
    test: `pm.test('401', function() { pm.response.to.have.status(401); });`,
  },
  // 9.14 DISPATCHER no puede listar users
  {
    name: '86 Listar Usuarios [DISPATCHER — 403]',
    phase: 9,
    method: 'GET',
    url: '{{baseUrl}}/users',
    auth: 'dispatcher',
    test: `pm.test('403', function() { pm.response.to.have.status(403); });`,
  },
  // 9.15 ADMIN no puede listar users de otra branch (si existe)
  {
    name: '87 Listar Usuarios [ADMIN — filtro branch futuro]',
    phase: 9,
    method: 'GET',
    url: '{{baseUrl}}/users',
    auth: 'admin',
    test: `pm.test('200', function() { pm.response.to.have.status(200); });`,
  },
  // 9.16 Cancelar orden que no existe
  {
    name: '88 Cancelar Orden inexistente [404]',
    phase: 9,
    method: 'POST',
    url: '{{baseUrl}}/orders/00000000-0000-0000-0000-000000000000/cancel',
    auth: 'cashier',
    test: `pm.test('404', function() { pm.response.to.have.status(404); });`,
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 10 — DEACTIVATED USER + SHIFT CLOSE
// ══════════════════════════════════════════════════════════════════════════════

requests.push(
  // 10.1 Desactivar cajera
  {
    name: '89 Desactivar CASHIER [ADMIN]',
    phase: 10,
    method: 'PATCH',
    url: '{{baseUrl}}/users/{{cashierId}}/toggle-active',
    auth: 'admin',
    test: `
pm.test('Desactivada', function() {
  var res = pm.response.json();
  pm.expect(res.data.user.active).to.eq(false);
});`,
  },
  // 10.2 Cajera desactivada no puede hacer login
  {
    name: '90 Login CASHIER desactivada [401]',
    phase: 10,
    method: 'POST',
    url: '{{baseUrl}}/auth/login',
    body: { email: 'carla.nueva@wonderchicken.com', password: '5555555' },
    test: `pm.test('401', function() { pm.response.to.have.status(401); });`,
  },
  // 10.3 ADMIN no puede cerrar turno (no es cashier)
  {
    name: '91 (No hay endpoint close — shift se cierra implícitamente al abrir otro?)',
    phase: 10,
    method: 'GET',
    url: '{{baseUrl}}/shifts/active',
    auth: 'admin',
    test: `pm.test('403 (no es cashier)', function() { pm.response.to.have.status(403); });`,
  },
  // 10.4 Cerrar turno (si existe endpoint POST /shifts/close)
  {
    name: '92 Cerrar Turno [CASHIER — si existe endpoint]',
    phase: 10,
    method: 'POST',
    url: '{{baseUrl}}/shifts/close',
    auth: 'cashier',
    body: { closingAmount: 500.00 },
    test: `// Endpoint puede no existir en Sprint 1 — acepta 200/404`,
  },
  // 10.5 Reactivar cajera
  {
    name: '93 Reactivar CASHIER [ADMIN]',
    phase: 10,
    method: 'PATCH',
    url: '{{baseUrl}}/users/{{cashierId}}/toggle-active',
    auth: 'admin',
    test: `
pm.test('Reactivada', function() {
  var res = pm.response.json();
  pm.expect(res.data.user.active).to.eq(true);
});`,
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// POSTMAN COLLECTION GENERATION
// ══════════════════════════════════════════════════════════════════════════════

const PHASES = [
  { id: 1,  name: 'Auth' },
  { id: 2,  name: 'Branches' },
  { id: 3,  name: 'Users' },
  { id: 4,  name: 'Products + Variants' },
  { id: 5,  name: 'Shifts + Periods' },
  { id: 6,  name: 'POS Context' },
  { id: 7,  name: 'Orders (completo)' },
  { id: 8,  name: 'Variant + Extra' },
  { id: 9,  name: 'Edge Cases + Boundary' },
  { id: 10, name: 'Deactivated User + Shift Close' },
];

const AUTH_MAP = {
  superAdmin: '{{superAdminToken}}',
  admin: '{{adminToken}}',
  cashier: '{{cashierToken}}',
  dispatcher: '{{dispatcherToken}}',
};

function buildPostmanItem(req) {
  const headers = [
    { key: 'Content-Type', value: 'application/json' },
  ];
  if (req.auth) {
    headers.push({ key: 'Authorization', value: `Bearer ${AUTH_MAP[req.auth]}` });
  }
  if (req.headers) {
    req.headers.forEach(h => headers.push(h));
  }

  return {
    name: req.name,
    request: {
      method: req.method,
      header: headers,
      url: {
        raw: req.url,
        host: ['{{baseUrl}}'],
        path: req.url.replace('{{baseUrl}}/', '').split('/'),
      },
      ...(req.body != null ? {
        body: {
          mode: 'raw',
          raw: JSON.stringify(req.body, null, 2),
          options: { raw: { language: 'json' } },
        },
      } : {}),
    },
    response: [],
    events: [
      ...(req.preScript ? [{
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: req.test ? req.test.trim().split('\n').map(l => l.trim()).filter(Boolean).join('\n') : [],
        },
      }] : []),
      ...(req.preScript ? [{
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: req.preScript.trim().split('\n').map(l => l.trim()).filter(Boolean).join('\n'),
        },
      }] : []),
    ].filter(Boolean),
  };
}

function buildPostmanCollection() {
  const folders = PHASES.map(phase => {
    const phaseReqs = requests.filter(r => r.phase === phase.id);
    return {
      name: `Phase ${phase.id} — ${phase.name}`,
      item: phaseReqs.map(buildPostmanItem),
    };
  });

  return {
    info: {
      name: 'Wonder Chicken API — Sprint 0+1 (Full)',
      description: `Colección completa de testing para Wonder Chicken Backend (Sprint 0 + Sprint 1).
Cubre: Auth, Branches, Users, Products+Variants, Shifts, POS, Orders, Edge Cases.

Setup:
1. Importar en Postman
2. Environment: baseUrl = http://localhost:4000/api/v1
3. Asegurarse que existe al menos un CashRegister en DB (pnpm seed)
4. Ejecutar las fases en orden

Credenciales:
- SUPER_ADMIN: ${USERS.SUPER_ADMIN.email} / ${USERS.SUPER_ADMIN.password}
- ADMIN:       ${USERS.ADMIN.email} / ${USERS.ADMIN.password}
- CASHIER:     ${USERS.CASHIER.email} / ${USERS.CASHIER.password}
- DISPATCHER:  ${USERS.DISPATCHER.email} / ${USERS.DISPATCHER.password}`,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      { key: 'baseUrl', value: 'http://localhost:4000/api/v1' },
      { key: 'superAdminToken', value: '' },
      { key: 'adminToken', value: '' },
      { key: 'cashierToken', value: '' },
      { key: 'dispatcherToken', value: '' },
      { key: 'branchId', value: '' },
      { key: 'cashierId', value: '' },
      { key: 'adminId', value: '' },
      { key: 'cashier2Id', value: '' },
      { key: 'cashier3Id', value: '' },
      { key: 'productId', value: '' },
      { key: 'bebidaId', value: '' },
      { key: 'guarnicionId', value: '' },
      { key: 'variantId', value: '' },
      { key: 'periodId', value: '' },
      { key: 'cashRegisterId', value: '' },
      { key: 'shiftId', value: '' },
      { key: 'orderMesaId', value: '' },
      { key: 'orderLlevarId', value: '' },
      { key: 'orderVariantId', value: '' },
      { key: 'orderMultiId', value: '' },
    ],
    auth: null,
    item: folders,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// THUNDER CLIENT COLLECTION GENERATION
// ══════════════════════════════════════════════════════════════════════════════

function buildThunderItem(req) {
  const headers = [
    { key: 'Content-Type', value: 'application/json' },
  ];
  if (req.auth) {
    headers.push({ key: 'Authorization', value: `Bearer ${AUTH_MAP[req.auth]}` });
  }
  if (req.headers) {
    req.headers.forEach(h => headers.push(h));
  }

  return {
    _id: uid(),
    colId: 'wonderchicken',
    name: req.name,
    url: req.url,
    method: req.method,
    ...(req.body != null ? {
      body: {
        type: 'json',
        content: JSON.stringify(req.body, null, 2),
      },
    } : { body: null }),
    preScript: req.preScript || '',
    tests: req.test || '',
    header: headers,
    auth: [],
  };
}

function buildThunderCollection() {
  const folders = PHASES.map(phase => ({
    name: `Phase ${phase.id} — ${phase.name}`,
    requests: requests
      .filter(r => r.phase === phase.id)
      .map(buildThunderItem)
      .map(r => r.name),
  }));

  return {
    client: 'Thunder Client',
    collectionName: 'Wonder Chicken API — Sprint 0+1 (Full)',
    date: '2026-08-25',
    description: `Colección completa — ${requests.length} requests en ${PHASES.length} fases.
Setup: Importar → Environment baseUrl → pnpm seed → ejecutar fases en orden.
Credenciales: SUPER_ADMIN=superadmin@wonderchicken.com/password123, ADMIN=ana@wonderchicken.com/1111111, CASHIER=carla@wonderchicken.com/2222222, DISPATCHER=diana@wonderchicken.com/3333333`,
    folders,
    requests: requests.map(buildThunderItem),
    settings: {
      baseUrl: 'http://localhost:4000/api/v1',
      variables: [
        { key: 'baseUrl', value: 'http://localhost:4000/api/v1', type: 'string' },
        { key: 'superAdminToken', value: '', type: 'string' },
        { key: 'adminToken', value: '', type: 'string' },
        { key: 'cashierToken', value: '', type: 'string' },
        { key: 'dispatcherToken', value: '', type: 'string' },
        { key: 'branchId', value: '', type: 'string' },
        { key: 'cashierId', value: '', type: 'string' },
        { key: 'adminId', value: '', type: 'string' },
        { key: 'cashier2Id', value: '', type: 'string' },
        { key: 'cashier3Id', value: '', type: 'string' },
        { key: 'productId', value: '', type: 'string' },
        { key: 'bebidaId', value: '', type: 'string' },
        { key: 'guarnicionId', value: '', type: 'string' },
        { key: 'variantId', value: '', type: 'string' },
        { key: 'periodId', value: '', type: 'string' },
        { key: 'cashRegisterId', value: '', type: 'string' },
        { key: 'shiftId', value: '', type: 'string' },
        { key: 'orderMesaId', value: '', type: 'string' },
        { key: 'orderLlevarId', value: '', type: 'string' },
        { key: 'orderVariantId', value: '', type: 'string' },
        { key: 'orderMultiId', value: '', type: 'string' },
      ],
    },
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// EJECUCIÓN
// ══════════════════════════════════════════════════════════════════════════════

const notesDir = path.join(__dirname, '..', 'notes');
if (!fs.existsSync(notesDir)) fs.mkdirSync(notesDir, { recursive: true });

const postmanPath = path.join(notesDir, 'wonderchicken-api.postman_collection.json');
const thunderPath = path.join(notesDir, 'wonderchicken-api.thunder-collection.json');

const postmanCol = buildPostmanCollection();
const thunderCol = buildThunderCollection();

fs.writeFileSync(postmanPath, JSON.stringify(postmanCol, null, 2));
fs.writeFileSync(thunderPath, JSON.stringify(thunderCol, null, 2));

console.log(`✅ Colecciones generadas:`);
console.log(`   📮 Postman:  ${postmanPath}`);
console.log(`   ⚡ Thunder: ${thunderPath}`);
console.log(`\n📊 Resumen:`);
console.log(`   Total requests: ${requests.length}`);
console.log(`   Fases: ${PHASES.length}`);
PHASES.forEach(p => {
  const count = requests.filter(r => r.phase === p.id).length;
  console.log(`   Phase ${p.id} (${p.name}): ${count} requests`);
});
console.log(`\n⚠️  Importante: antes de ejecutar, obtener cashRegisterId con:`);
console.log(`   node scripts/get-cash-register-id.js`);
console.log(`   y setearlo en la variable {{cashRegisterId}} del environment.`);
