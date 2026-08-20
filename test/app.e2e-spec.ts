import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

interface BranchData {
  id: string;
  name: string;
  address: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BranchResponse {
  isSuccess: boolean;
  message: string;
  data: { branch: BranchData };
  error: null;
}

interface BranchListResponse {
  isSuccess: boolean;
  message: string;
  data: { branches: BranchData[]; total: number };
  error: null;
}

interface AuthResponse {
  isSuccess: boolean;
  message: string;
  data: { accessToken: string };
  error: null;
}

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('/api/v1/auth/login (POST) — credenciales inválidas devuelven 401', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: 'no-existe', password: 'password123' })
      .expect(401);
  });

  describe('/api/v1/branches (SUPER_ADMIN only)', () => {
    let superAdminToken: string;
    let adminToken: string;
    let createdBranchId: string;

    beforeAll(async () => {
      // Login como SUPER_ADMIN (creado por seeder)
      const superAdminLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: 'superadmin', password: 'password123' })
        .expect(200);
      const superAdminBody = superAdminLogin.body as AuthResponse;
      superAdminToken = superAdminBody.data.accessToken;

      // Crear un admin de prueba para los tests 403
      const createAdminRes = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'E2E Admin',
          username: 'e2e-admin',
          password: 'password123',
          role: 'ADMIN',
        })
        .expect(201);

      // Login como el admin de prueba
      const adminLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ username: 'e2e-admin', password: 'password123' })
        .expect(200);
      const adminBody = adminLogin.body as AuthResponse;
      adminToken = adminBody.data.accessToken;
    });

    describe('POST /api/v1/branches', () => {
      it('debería crear una sucursal con SUPER_ADMIN (201)', () => {
        return request(app.getHttpServer())
          .post('/api/v1/branches')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({ name: 'Sucursal E2E', address: 'Dirección E2E 123' })
          .expect(201)
          .then((res) => {
            const body = res.body as BranchResponse;
            expect(body.isSuccess).toBe(true);
            expect(body.data.branch.name).toBe('Sucursal E2E');
            expect(body.data.branch.address).toBe('Dirección E2E 123');
            expect(body.data.branch.active).toBe(true);
            createdBranchId = body.data.branch.id;
          });
      });

      it('debería rechazar creación sin SUPER_ADMIN (403)', () => {
        return request(app.getHttpServer())
          .post('/api/v1/branches')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Sucursal No Permitida', address: 'Dirección 456' })
          .expect(403);
      });

      it('debería rechazar creación con datos inválidos (400)', () => {
        return request(app.getHttpServer())
          .post('/api/v1/branches')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({ name: '', address: '' })
          .expect(400);
      });
    });

    describe('GET /api/v1/branches', () => {
      it('debería listar sucursales con SUPER_ADMIN (200)', () => {
        return request(app.getHttpServer())
          .get('/api/v1/branches')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200)
          .then((res) => {
            const body = res.body as BranchListResponse;
            expect(body.isSuccess).toBe(true);
            expect(Array.isArray(body.data.branches)).toBe(true);
            expect(body.data.branches.length).toBeGreaterThan(0);
          });
      });

      it('debería rechazar listado sin SUPER_ADMIN (403)', () => {
        return request(app.getHttpServer())
          .get('/api/v1/branches')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(403);
      });
    });

    describe('PATCH /api/v1/branches/:id', () => {
      it('debería actualizar una sucursal con SUPER_ADMIN (200)', () => {
        return request(app.getHttpServer())
          .patch(`/api/v1/branches/${createdBranchId}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({ name: 'Sucursal E2E Actualizada' })
          .expect(200)
          .then((res) => {
            const body = res.body as BranchResponse;
            expect(body.isSuccess).toBe(true);
            expect(body.data.branch.name).toBe('Sucursal E2E Actualizada');
          });
      });

      it('debería rechazar actualización sin SUPER_ADMIN (403)', () => {
        return request(app.getHttpServer())
          .patch(`/api/v1/branches/${createdBranchId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'No Permitido' })
          .expect(403);
      });

      it('debería devolver 404 para sucursal inexistente (404)', () => {
        return request(app.getHttpServer())
          .patch('/api/v1/branches/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({ name: 'Inexistente' })
          .expect(404);
      });
    });

    describe('PATCH /api/v1/branches/:id/toggle-active', () => {
      it('debería desactivar una sucursal con SUPER_ADMIN (200)', () => {
        return request(app.getHttpServer())
          .patch(`/api/v1/branches/${createdBranchId}/toggle-active`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200)
          .then((res) => {
            const body = res.body as BranchResponse;
            expect(body.isSuccess).toBe(true);
            expect(body.data.branch.active).toBe(false);
          });
      });

      it('debería reactivar una sucursal inactiva con SUPER_ADMIN (200)', () => {
        return request(app.getHttpServer())
          .patch(`/api/v1/branches/${createdBranchId}/toggle-active`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200)
          .then((res) => {
            const body = res.body as BranchResponse;
            expect(body.isSuccess).toBe(true);
            expect(body.data.branch.active).toBe(true);
          });
      });

      it('debería rechazar la operación sin SUPER_ADMIN (403)', () => {
        return request(app.getHttpServer())
          .patch(`/api/v1/branches/${createdBranchId}/toggle-active`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(403);
      });

      it('debería devolver 404 para sucursal inexistente (404)', () => {
        return request(app.getHttpServer())
          .patch(
            '/api/v1/branches/00000000-0000-0000-0000-000000000000/toggle-active',
          )
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(404);
      });
    });
  });
});
