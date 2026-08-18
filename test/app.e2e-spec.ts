import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

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
});
