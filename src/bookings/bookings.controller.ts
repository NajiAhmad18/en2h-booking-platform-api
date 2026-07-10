import {
  Controller,
  Get,
  Post,
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
} from '@nestjs/swagger';
import { BookingsService, PaginatedBookings } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingResponse } from './utils/booking.mapper';

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
}
