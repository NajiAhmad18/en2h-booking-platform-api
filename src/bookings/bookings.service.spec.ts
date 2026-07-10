/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';

const TZ = 'Asia/Colombo';

// Future date far enough ahead to pass the 1-minute buffer
const FUTURE_DATE = '2027-08-15';
const FUTURE_TIME = '14:30';

const mockService = {
  id: 'svc-uuid',
  title: 'Test',
  description: 'desc',
  duration: 60,
  price: new Prisma.Decimal(100),
  isActive: true,
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBooking = {
  id: 'bk-uuid',
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  customerPhone: '+94771234567',
  serviceId: 'svc-uuid',
  bookingDateTime: new Date('2027-08-15T09:00:00.000Z'), // 14:30 Colombo
  status: BookingStatus.PENDING,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: {
            service: { findUnique: jest.fn() },
            booking: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(TZ) },
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    const dto = {
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '+94771234567',
      serviceId: 'svc-uuid',
      bookingDate: FUTURE_DATE,
      bookingTime: FUTURE_TIME,
    };

    it('should throw NotFoundException if service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if service is inactive', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...mockService,
        isActive: false,
      });
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid calendar date (2026-02-30)', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);
      await expect(
        service.create({ ...dto, bookingDate: '2026-02-30' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for past booking', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);
      await expect(
        service.create({
          ...dto,
          bookingDate: '2020-01-01',
          bookingTime: '10:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException for duplicate slot (app-level)', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for P2002 race condition', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.booking.findUnique.mockResolvedValue(null);
      prisma.booking.create.mockRejectedValue(
        Object.assign(
          new Prisma.PrismaClientKnownRequestError('Unique constraint', {
            code: 'P2002',
            clientVersion: '5.0.0',
          }),
        ),
      );
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should create a booking with PENDING status and serialize correctly', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.booking.findUnique.mockResolvedValue(null);
      prisma.booking.create.mockResolvedValue(mockBooking);

      const result = await service.create(dto);

      expect(result.status).toBe(BookingStatus.PENDING);
      expect(result.bookingDate).toBeDefined();
      expect(result.bookingTime).toBeDefined();
      // bookingDateTime must NOT be on the response
      expect(
        (result as Record<string, unknown>).bookingDateTime,
      ).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated results with metadata', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      prisma.booking.count.mockResolvedValue(15);

      const result = await service.findAll({ page: 2, limit: 5 });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        totalItems: 15,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(result.data.length).toBe(1);
      expect(
        (result.data[0] as Record<string, unknown>).bookingDateTime,
      ).toBeUndefined();
    });

    it('should apply status filter', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.booking.count.mockResolvedValue(0);

      await service.findAll({ status: BookingStatus.CONFIRMED });

      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: BookingStatus.CONFIRMED }),
        }),
      );
    });

    it('should apply serviceId filter', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.booking.count.mockResolvedValue(0);

      await service.findAll({ serviceId: 'svc-uuid' });

      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ serviceId: 'svc-uuid' }),
        }),
      );
    });

    it('should build OR clause for search query', async () => {
      prisma.booking.findMany.mockResolvedValue([]);
      prisma.booking.count.mockResolvedValue(0);

      await service.findAll({ search: 'Naji' });

      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                customerName: expect.objectContaining({ contains: 'Naji' }),
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return mapped booking response', async () => {
      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      const result = await service.findOne('bk-uuid');
      expect(result.id).toBe('bk-uuid');
      expect(
        (result as Record<string, unknown>).bookingDateTime,
      ).toBeUndefined();
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
