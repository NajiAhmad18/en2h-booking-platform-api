/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsEmail,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class BookingQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (min 1, default 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page (min 1, max 100, default 10)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: BookingStatus,
    description: 'Filter by booking status',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({
    example: 'uuid-of-service',
    description: 'Filter by service UUID',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    example: '2027-08-15',
    description: 'Filter by booking date (YYYY-MM-DD)',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'bookingDate must be in YYYY-MM-DD format',
  })
  bookingDate?: string;

  @ApiPropertyOptional({
    example: 'customer@example.com',
    description: 'Filter by customer email',
  })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  customerEmail?: string;

  @ApiPropertyOptional({
    example: 'Naji',
    description:
      'Search across customerName, customerEmail, customerPhone (case-insensitive contains)',
  })
  @IsOptional()
  search?: string;
}
