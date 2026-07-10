/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('BookingsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let serviceId: string;
  let bookingId: string;

  const ts = Date.now();
  const testEmail = `bk_admin_${ts}@example.com`;

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
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Register and login a test admin user
    const regRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Booking Admin',
        email: testEmail,
        password: 'StrongPassword1!',
      });
    accessToken = regRes.body.accessToken;

    // Create an active test service
    const svcRes = await request(app.getHttpServer())
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: `E2E Booking Service ${ts}`,
        description: 'A service for booking E2E tests.',
        duration: 60,
        price: 100,
      });
    serviceId = svcRes.body.id;
  });

  afterAll(async () => {
    // Clean up bookings and the test service
    if (bookingId) {
      await prisma.booking.deleteMany({ where: { serviceId } });
    }
    if (serviceId) {
      await prisma.service.delete({ where: { id: serviceId } });
    }
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await app.close();
  });

  describe('POST /api/v1/bookings (Public)', () => {
    it('should return 400 for invalid date format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send({
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerPhone: '+94771234567',
          serviceId,
          bookingDate: '15-08-2027', // wrong format
          bookingTime: '14:30',
        })
        .expect(400);
    });

    it('should return 400 for invalid time format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send({
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerPhone: '+94771234567',
          serviceId,
          bookingDate: '2027-08-15',
          bookingTime: '9:00', // wrong format
        })
        .expect(400);
    });

    it('should return 400 for unknown fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send({
          customerName: 'Test',
          customerEmail: 'test@example.com',
          customerPhone: '+94771234567',
          serviceId,
          bookingDate: '2027-08-15',
          bookingTime: '14:30',
          status: 'CONFIRMED', // should not be accepted
        })
        .expect(400);
    });

    it('should return 400 for past booking', () => {
      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send({
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerPhone: '+94771234567',
          serviceId,
          bookingDate: '2020-01-01',
          bookingTime: '10:00',
        })
        .expect(400);
    });

    it('should return 404 for inactive/missing service', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send({
          customerName: 'Test User',
          customerEmail: 'test@example.com',
          customerPhone: '+94771234567',
          serviceId: '00000000-0000-0000-0000-000000000000',
          bookingDate: '2027-08-15',
          bookingTime: '14:30',
        })
        .expect(404);
    });

    it('should create a booking successfully and return PENDING status', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send({
          customerName: 'Naji Ahmad',
          customerEmail: 'naji@example.com',
          customerPhone: '+94771234567',
          serviceId,
          bookingDate: '2027-08-15',
          bookingTime: '10:00',
        })
        .expect(201);

      expect(res.body.status).toBe('PENDING');
      expect(res.body.bookingDate).toBe('2027-08-15');
      expect(res.body.bookingTime).toBe('10:00');
      expect(res.body.bookingDateTime).toBeUndefined();

      bookingId = res.body.id;
    });

    it('should return 409 for duplicate time slot', () => {
      return request(app.getHttpServer())
        .post('/api/v1/bookings')
        .send({
          customerName: 'Another Customer',
          customerEmail: 'another@example.com',
          customerPhone: '+94779999999',
          serviceId,
          bookingDate: '2027-08-15',
          bookingTime: '10:00',
        })
        .expect(409);
    });
  });

  describe('GET /api/v1/bookings (Protected)', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/api/v1/bookings').expect(401);
    });

    it('should return paginated bookings with token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
    });

    it('should filter by serviceId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/bookings?serviceId=${serviceId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const found = res.body.data.find((b: any) => b.id === bookingId);
      expect(found).toBeDefined();
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings?status=PENDING')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.every((b: any) => b.status === 'PENDING')).toBe(
        true,
      );
    });

    it('should search by customerName', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/bookings?search=Naji')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/bookings/:id (Protected)', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/bookings/${bookingId}`)
        .expect(401);
    });

    it('should return booking by ID with token', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(bookingId);
      expect(res.body.bookingDate).toBe('2027-08-15');
      expect(res.body.bookingTime).toBe('10:00');
      expect(res.body.bookingDateTime).toBeUndefined();
    });

    it('should return 400 for invalid UUID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/bookings/not-a-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should return 404 for non-existent booking', () => {
      return request(app.getHttpServer())
        .get('/api/v1/bookings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
