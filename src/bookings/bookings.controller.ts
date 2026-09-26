import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingDto, BookingQueryDto } from './dto/booking.dto';
import { Booking, BookingStatus } from './schemas/booking.schema';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully', type: Booking })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - photographer not available at requested time' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createBookingDto: CreateBookingDto): Promise<Booking> {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of bookings with pagination info' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() queryDto: BookingQueryDto) {
    return this.bookingsService.findAll(queryDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get booking statistics' })
  @ApiQuery({ name: 'photographerId', required: false, description: 'Filter by photographer ID' })
  @ApiResponse({ status: 200, description: 'Booking statistics' })
  async getStats(@Query('photographerId') photographerId?: string) {
    return this.bookingsService.getStats(photographerId);
  }

  @Get('photographer/:photographerId')
  @ApiOperation({ summary: 'Get bookings for a specific photographer' })
  @ApiParam({ name: 'photographerId', description: 'Photographer ID' })
  @ApiResponse({ status: 200, description: 'List of bookings for the photographer' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findByPhotographer(
    @Param('photographerId') photographerId: string,
    @Query() queryDto: BookingQueryDto,
  ) {
    return this.bookingsService.findByPhotographer(photographerId, queryDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get bookings for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of bookings for the user' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findByUser(
    @Param('userId') userId: string,
    @Query() queryDto: BookingQueryDto,
  ) {
    return this.bookingsService.findByUser(userId, queryDto);
  }

  @Get('photographer/:photographerId/upcoming')
  @ApiOperation({ summary: 'Get upcoming bookings for a photographer' })
  @ApiParam({ name: 'photographerId', description: 'Photographer ID' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'List of upcoming bookings' })
  async getUpcomingBookings(
    @Param('photographerId') photographerId: string,
    @Query('limit') limit?: number,
  ) {
    return this.bookingsService.getUpcomingBookings(photographerId, limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking found', type: Booking })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async findOne(@Param('id') id: string): Promise<Booking> {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking updated successfully', type: Booking })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 409, description: 'Conflict - photographer not available at requested time' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto): Promise<Booking> {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking status updated successfully', type: Booking })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format or status' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateStatus(@Param('id') id: string, @Body('status') status: BookingStatus): Promise<Booking> {
    return this.bookingsService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 204, description: 'Booking deleted successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.bookingsService.remove(id);
  }
}