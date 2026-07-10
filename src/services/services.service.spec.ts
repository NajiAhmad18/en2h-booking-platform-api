/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Prisma, Service } from '@prisma/client';

describe('ServicesService', () => {
  let service: ServicesService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: PrismaService,
          useValue: {
            service: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockService: Service = {
    id: 'uuid-123',
    title: 'Test Service',
    description: 'Test Description',
    duration: 60,
    price: new Prisma.Decimal(100.5),
    isActive: true,
    createdById: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a new service and serialize the price', async () => {
      const dto = {
        title: 'New',
        description: 'Desc',
        duration: 30,
        price: 50.0,
      };
      prisma.service.create.mockResolvedValue(mockService);

      const result = await service.create(dto, 'user-123');

      expect(prisma.service.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New',
          price: expect.any(Prisma.Decimal),
          createdById: 'user-123',
        }),
      });
      expect(result.price).toBe('100.50'); // Mocked Prisma Decimal 100.5
    });
  });

  describe('findAll', () => {
    it('should return paginated active services', async () => {
      prisma.service.findMany.mockResolvedValue([mockService, mockService]);
      prisma.service.count.mockResolvedValue(15);

      const result = await service.findAll(2, 2);

      expect(prisma.service.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 2,
        take: 2,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.pagination).toEqual({
        page: 2,
        limit: 2,
        totalItems: 15,
        totalPages: 8,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(result.data.length).toBe(2);
      expect(result.data[0].price).toBe('100.50');
    });
  });

  describe('findOne', () => {
    it('should return an active service by ID', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);

      const result = await service.findOne('uuid-123');
      expect(result.id).toBe('uuid-123');
      expect(result.price).toBe('100.50');
    });

    it('should throw NotFoundException if missing', async () => {
      prisma.service.findUnique.mockResolvedValue(null);
      await expect(service.findOne('uuid-404')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if inactive publicly', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...mockService,
        isActive: false,
      });
      await expect(service.findOne('uuid-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and serialize service', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.service.update.mockResolvedValue({
        ...mockService,
        title: 'Updated',
      });

      const result = await service.update('uuid-123', { title: 'Updated' });

      expect(prisma.service.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: expect.objectContaining({ title: 'Updated' }),
      });
      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundException if updating missing service', async () => {
      prisma.service.findUnique.mockResolvedValue(null);
      await expect(
        service.update('uuid-404', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should perform logical deletion', async () => {
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.service.update.mockResolvedValue({
        ...mockService,
        isActive: false,
      });

      const result = await service.remove('uuid-123');

      expect(prisma.service.update).toHaveBeenCalledWith({
        where: { id: 'uuid-123' },
        data: { isActive: false },
      });
      expect(result.isActive).toBe(false);
    });

    it('should be idempotent if already inactive', async () => {
      prisma.service.findUnique.mockResolvedValue({
        ...mockService,
        isActive: false,
      });

      const result = await service.remove('uuid-123');

      expect(prisma.service.update).not.toHaveBeenCalled();
      expect(result.isActive).toBe(false);
    });
  });
});
