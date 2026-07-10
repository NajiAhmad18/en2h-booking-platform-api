import { Booking, BookingStatus } from '@prisma/client';
import { convertUtcToLocal } from './timezone.util';

export interface BookingResponse {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceId: string;
  bookingDate: string;
  bookingTime: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Reusable mapper: converts a raw Prisma Booking into a clean API response.
 * The internal bookingDateTime (UTC) is split back into bookingDate and bookingTime
 * using the provided timezone. bookingDateTime is never exposed.
 */
export function mapBookingToResponse(
  booking: Booking,
  timezone: string,
): BookingResponse {
  const { bookingDate, bookingTime } = convertUtcToLocal(
    booking.bookingDateTime,
    timezone,
  );
  return {
    id: booking.id,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    serviceId: booking.serviceId,
    bookingDate,
    bookingTime,
    status: booking.status,
    notes: booking.notes,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}
