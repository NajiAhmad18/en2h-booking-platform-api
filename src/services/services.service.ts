import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service, Prisma } from '@prisma/client';

import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

export type SerializedService = Omit<Service, 'price'> & { price: string };

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeService(service: Service): SerializedService {
    return {
      ...service,
      price: service.price.toFixed(2),
    };
  }

  async create(
    createServiceDto: CreateServiceDto,
    userId: string,
  ): Promise<SerializedService> {
    const data: Prisma.ServiceUncheckedCreateInput = {
      title: createServiceDto.title,
      description: createServiceDto.description,
      duration: createServiceDto.duration,
      price: new Prisma.Decimal(createServiceDto.price),
      isActive: createServiceDto.isActive ?? true,
      createdById: userId,
    };

    const service = await this.prisma.service.create({ data });
    return this.serializeService(service);
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<SerializedService>> {
    const skip = (page - 1) * limit;

    const [services, totalItems] = await Promise.all([
      this.prisma.service.findMany({
        where: { isActive: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.service.count({
        where: { isActive: true },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: services.map((service) => this.serializeService(service)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<SerializedService> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException(
        `Service with ID ${id} not found or is inactive`,
      );
    }

    return this.serializeService(service);
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<SerializedService> {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    const data: Prisma.ServiceUncheckedUpdateInput = {
      ...(updateServiceDto.title !== undefined && {
        title: updateServiceDto.title,
      }),
      ...(updateServiceDto.description !== undefined && {
        description: updateServiceDto.description,
      }),
      ...(updateServiceDto.duration !== undefined && {
        duration: updateServiceDto.duration,
      }),
      ...(updateServiceDto.price !== undefined && {
        price: new Prisma.Decimal(updateServiceDto.price),
      }),
      ...(updateServiceDto.isActive !== undefined && {
        isActive: updateServiceDto.isActive,
      }),
    };

    const updatedService = await this.prisma.service.update({
      where: { id },
      data,
    });

    return this.serializeService(updatedService);
  }

  async remove(id: string): Promise<SerializedService> {
    const existing = await this.prisma.service.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Idempotent logical deletion: if already inactive, just return it
    if (!existing.isActive) {
      return this.serializeService(existing);
    }

    const deactivatedService = await this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return this.serializeService(deactivatedService);
  }
}
