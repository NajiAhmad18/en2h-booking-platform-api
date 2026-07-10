/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MaxLength,
  MinLength,
  IsUUID,
  IsOptional,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    example: 'Naji Ahmad',
    description: 'Full name of the customer (2-100 chars)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  customerName: string;

  @ApiProperty({
    example: 'naji@example.com',
    description: 'Valid customer email (max 254 chars)',
  })
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  customerEmail: string;

  @ApiProperty({
    example: '+94771234567',
    description:
      'Customer phone number (7-20 chars, allows +, spaces, hyphens, parentheses)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(20)
  @Matches(/^[+\d\s\-().]+$/, {
    message: 'customerPhone must contain only valid phone characters',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  customerPhone: string;

  @ApiProperty({
    example: 'uuid-of-service',
    description: 'UUID of the service to book',
  })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    example: '2027-08-15',
    description: 'Booking date in YYYY-MM-DD format (Asia/Colombo)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'bookingDate must be in YYYY-MM-DD format',
  })
  bookingDate: string;

  @ApiProperty({
    example: '14:30',
    description: 'Booking time in HH:mm 24-hour format (Asia/Colombo)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'bookingTime must be in HH:mm format' })
  bookingTime: string;

  @ApiPropertyOptional({
    example: 'Please use the back entrance.',
    description: 'Optional notes (max 1000 chars)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string;
}
