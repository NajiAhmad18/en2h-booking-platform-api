import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
    description:
      'New booking status. Allowed transitions: PENDING→CONFIRMED, PENDING→CANCELLED, CONFIRMED→COMPLETED, CONFIRMED→CANCELLED. Same-status updates are idempotent (HTTP 200).',
  })
  @IsNotEmpty()
  @IsEnum(BookingStatus, {
    message: `status must be one of: ${Object.values(BookingStatus).join(', ')}`,
  })
  status: BookingStatus;
}
