import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Booking, BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { convertLocalToUtc, isFutureBooking } from './utils/timezone.util';
import { BookingResponse, mapBookingToResponse } from './utils/booking.mapper';

export interface PaginatedBookings {
  data: BookingResponse[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

@Injectable()
export class BookingsService {
  private readonly timezone: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.timezone = this.config.get<string>('APP_TIMEZONE') ?? 'UTC';
  }

  async create(dto: CreateBookingDto): Promise<BookingResponse> {
    // 1. Validate service existence and active status
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service || !service.isActive) {
      throw new NotFoundException(
        `Service with ID ${dto.serviceId} not found or is inactive`,
      );
    }

    // 2. Parse and validate date+time, convert to UTC
    let bookingDateTime: Date;
    try {
      bookingDateTime = convertLocalToUtc(
        dto.bookingDate,
        dto.bookingTime,
        this.timezone,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid date or time';
      throw new BadRequestException(message);
    }

    // 3. Reject past bookings — full UTC datetime must be strictly after now
    if (!isFutureBooking(bookingDateTime)) {
      throw new BadRequestException(
        'Booking date and time must be in the future',
      );
    }

    // 4. Application-level duplicate pre-check
    const existing = await this.prisma.booking.findUnique({
      where: {
        serviceId_bookingDateTime: {
          serviceId: dto.serviceId,
          bookingDateTime,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        'This time slot is already booked for the selected service',
      );
    }

    // 5. Create booking — catch P2002 race condition
    try {
      const booking = await this.prisma.booking.create({
        data: {
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          serviceId: dto.serviceId,
          bookingDateTime,
          status: BookingStatus.PENDING,
          notes: dto.notes,
        },
      });
      return mapBookingToResponse(booking, this.timezone);
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'This time slot is already booked for the selected service',
        );
      }
      throw err;
    }
  }

  async findAll(query: BookingQueryDto): Promise<PaginatedBookings> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.serviceId) where.serviceId = query.serviceId;
    if (query.customerEmail) where.customerEmail = query.customerEmail;

    // bookingDate filter: convert YYYY-MM-DD range to UTC datetime range
    if (query.bookingDate) {
      let startUtc: Date;
      let endUtc: Date;
      try {
        startUtc = convertLocalToUtc(query.bookingDate, '00:00', this.timezone);
        endUtc = convertLocalToUtc(query.bookingDate, '23:59', this.timezone);
      } catch {
        throw new BadRequestException('Invalid bookingDate filter value');
      }
      where.bookingDateTime = { gte: startUtc, lte: endUtc };
    }

    // Simple case-insensitive search across name, email, phone
    if (query.search) {
      where.OR = [
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { customerEmail: { contains: query.search, mode: 'insensitive' } },
        { customerPhone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [bookings, totalItems] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { bookingDateTime: 'asc' },
      }),
      this.prisma.booking.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: bookings.map((b: Booking) =>
        mapBookingToResponse(b, this.timezone),
      ),
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

  async findOne(id: string): Promise<BookingResponse> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return mapBookingToResponse(booking, this.timezone);
  }
}
