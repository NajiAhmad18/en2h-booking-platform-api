/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('ServicesController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let serviceId: string;

  const testEmail = `admin_${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Register a test user to get a token
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Service Admin',
        email: testEmail,
        password: 'StrongPassword1!',
      });
    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/services (POST)', () => {
    it('should reject unauthenticated requests (401)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/services')
        .send({
          title: 'Test',
          description: 'Test desc',
          duration: 60,
          price: 100,
        })
        .expect(401);
    });

    it('should reject invalid payloads (400)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'A', duration: -10 }) // too short title, negative duration
        .expect(400);
    });

    it('should reject unknown fields in payload (400)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Service',
          description: 'Description here',
          duration: 60,
          price: 100,
          unknownField: true,
        })
        .expect(400);
    });

    it('should create a service securely', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'E2E Test Service',
          description: 'A valid description for a service.',
          duration: 90,
          price: 149.99,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('E2E Test Service');
      expect(res.body.price).toBe('149.99');

      serviceId = res.body.id;
    });
  });

  describe('/api/v1/services (GET)', () => {
    it('should list active services with pagination metadata publicly', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/services?page=1&limit=5')
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);

      const found = res.body.data.find((s: any) => s.id === serviceId);
      expect(found).toBeDefined();
      expect(found.price).toBe('149.99');
    });
  });

  describe('/api/v1/services/:id (GET)', () => {
    it('should retrieve a single active service publicly', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/services/${serviceId}`)
        .expect(200);

      expect(res.body.id).toBe(serviceId);
      expect(res.body.price).toBe('149.99');
    });

    it('should return 400 for invalid UUID format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/services/not-a-uuid')
        .expect(400);
    });
  });

  describe('/api/v1/services/:id (PATCH)', () => {
    it('should reject empty updates (400)', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/services/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });

    it('should update the service securely', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/services/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ price: 199.99 })
        .expect(200);

      expect(res.body.price).toBe('199.99');
    });
  });

  describe('/api/v1/services/:id (DELETE)', () => {
    it('should logically delete the service', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/services/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.isActive).toBe(false);
    });

    it('should be idempotent and return 200 if already deleted', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/services/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.isActive).toBe(false);
    });

    it('should no longer appear in public lists (404)', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/services/${serviceId}`)
        .expect(404);
    });

    it('should be reactivatable via PATCH', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/services/${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ isActive: true })
        .expect(200);

      expect(res.body.isActive).toBe(true);

      // Verify it's public again
      await request(app.getHttpServer())
        .get(`/api/v1/services/${serviceId}`)
        .expect(200);
    });
  });
});
