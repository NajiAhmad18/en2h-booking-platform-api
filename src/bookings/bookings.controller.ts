import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { BookingsService, PaginatedBookings } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingResponse } from './utils/booking.mapper';
import { RejectEmptyBodyPipe } from '../services/pipes/reject-empty-body.pipe';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new booking (Public)',
    description:
      'Anyone can submit a booking. bookingDate and bookingTime are interpreted in Asia/Colombo timezone. Status always starts as PENDING.',
  })
  @ApiResponse({ status: 201, description: 'Booking created successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Validation error, invalid date/time, or past booking.',
  })
  @ApiResponse({ status: 404, description: 'Service not found or inactive.' })
  @ApiResponse({
    status: 409,
    description: 'Duplicate time slot for the selected service.',
  })
  create(@Body() createBookingDto: CreateBookingDto): Promise<BookingResponse> {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all bookings with pagination and filters (Protected)',
    description:
      'Returns paginated bookings. Supports filtering by status, serviceId, bookingDate, customerEmail, and free-text search.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default 10, max 100)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
  })
  @ApiQuery({ name: 'serviceId', required: false, type: String })
  @ApiQuery({
    name: 'bookingDate',
    required: false,
    type: String,
    description: 'YYYY-MM-DD',
  })
  @ApiQuery({ name: 'customerEmail', required: false, type: String })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search customerName, customerEmail, customerPhone',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of bookings.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Query() query: BookingQueryDto): Promise<PaginatedBookings> {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a booking by ID (Protected)' })
  @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
  @ApiResponse({ status: 200, description: 'Booking details.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BookingResponse> {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update booking status (Protected)',
    description: `Updates the booking status using an explicit transition map.

Allowed cross-status transitions:
- PENDING → CONFIRMED
- PENDING → CANCELLED
- CONFIRMED → COMPLETED
- CONFIRMED → CANCELLED

Rejected cross-status transitions (returns 409):
- PENDING → COMPLETED (must confirm first)
- CANCELLED → CONFIRMED / COMPLETED / PENDING (terminal state)
- COMPLETED → PENDING / CONFIRMED / CANCELLED (terminal state)

Same-status transitions are always idempotent: returns HTTP 200 with the unchanged booking and no database write. This applies to ALL statuses including CANCELLED and COMPLETED.`,
  })
  @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
  @ApiBody({ type: UpdateBookingStatusDto })
  @ApiResponse({ status: 200, description: 'Status updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID or empty body.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  @ApiResponse({
    status: 409,
    description: 'Transition not allowed for current status.',
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(RejectEmptyBodyPipe) dto: UpdateBookingStatusDto,
  ): Promise<BookingResponse> {
    return this.bookingsService.updateStatus(id, dto.status);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel a booking (Protected)',
    description: `Logically cancels a booking. No rows are deleted.
Behaviour:
- PENDING → CANCELLED
- CONFIRMED → CANCELLED
- CANCELLED → idempotent, returns current booking (HTTP 200)
- COMPLETED → HTTP 409 (completed bookings cannot be cancelled)`,
  })
  @ApiParam({ name: 'id', type: String, description: 'Booking UUID' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled (or already cancelled — idempotent).',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  @ApiResponse({
    status: 409,
    description: 'Completed bookings cannot be cancelled.',
  })
  cancel(@Param('id', ParseUUIDPipe) id: string): Promise<BookingResponse> {
    return this.bookingsService.cancel(id);
  }
}
