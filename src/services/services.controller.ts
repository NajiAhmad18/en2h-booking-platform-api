import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ServicesService,
  PaginatedResult,
  SerializedService,
} from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { RejectEmptyBodyPipe } from './pipes/reject-empty-body.pipe';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service (Protected)' })
  @ApiResponse({
    status: 201,
    description: 'The service has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser() user: Omit<User, 'passwordHash'>,
  ): Promise<SerializedService> {
    return this.servicesService.create(createServiceDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all active services with pagination (Public)',
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
    description: 'Items per page (default 10)',
  })
  @ApiResponse({ status: 200, description: 'List of active services.' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedResult<SerializedService>> {
    // Enforce limits
    const safeLimit = limit > 100 ? 100 : limit;
    const safePage = page < 1 ? 1 : page;
    return this.servicesService.findAll(safePage, safeLimit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an active service by ID (Public)' })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'The service details.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID.' })
  @ApiResponse({ status: 404, description: 'Service not found or inactive.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SerializedService> {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service (Protected)' })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiResponse({
    status: 200,
    description: 'The service has been successfully updated.',
  })
  @ApiResponse({ status: 400, description: 'Validation error or empty body.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(RejectEmptyBodyPipe) updateServiceDto: UpdateServiceDto,
  ): Promise<SerializedService> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logically delete a service (Protected)' })
  @ApiParam({ name: 'id', type: String, description: 'Service UUID' })
  @ApiResponse({
    status: 200,
    description: 'The service was successfully deactivated (idempotent).',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<SerializedService> {
    return this.servicesService.remove(id);
  }
}
