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
import { AvailabilitiesService } from './availabilities.service';
import { CreateAvailabilityDto, UpdateAvailabilityDto, AvailabilityQueryDto } from './dto/availability.dto';
import { Availability } from '../schemas/availability.schema';

@ApiTags('availabilities')
@Controller('availabilities')
export class AvailabilitiesController {
  constructor(private readonly availabilitiesService: AvailabilitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new availability' })
  @ApiResponse({ status: 201, description: 'Availability created successfully', type: Availability })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - availability already exists' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createDto: CreateAvailabilityDto): Promise<Availability> {
    return this.availabilitiesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all availabilities with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of availabilities with pagination info' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() queryDto: AvailabilityQueryDto) {
    return this.availabilitiesService.findAll(queryDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get availabilities for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of availabilities for the user' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findByUser(
    @Param('userId') userId: string,
    @Query() queryDto: AvailabilityQueryDto,
  ) {
    return this.availabilitiesService.findByUser(userId, queryDto);
  }

  @Get('user/:userId/range')
  @ApiOperation({ summary: 'Get user availability in a date range' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'startDate', required: true, example: '2024-06-01T00:00:00.000Z' })
  @ApiQuery({ name: 'endDate', required: true, example: '2024-06-30T23:59:59.999Z' })
  @ApiResponse({ status: 200, description: 'List of availabilities in range' })
  async getUserAvailability(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.availabilitiesService.getUserAvailability(userId, new Date(startDate), new Date(endDate));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an availability by ID' })
  @ApiParam({ name: 'id', description: 'Availability ID' })
  @ApiResponse({ status: 200, description: 'Availability found', type: Availability })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async findOne(@Param('id') id: string): Promise<Availability> {
    return this.availabilitiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an availability' })
  @ApiParam({ name: 'id', description: 'Availability ID' })
  @ApiResponse({ status: 200, description: 'Availability updated successfully', type: Availability })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 409, description: 'Conflict - availability already exists' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() updateDto: UpdateAvailabilityDto): Promise<Availability> {
    return this.availabilitiesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an availability' })
  @ApiParam({ name: 'id', description: 'Availability ID' })
  @ApiResponse({ status: 204, description: 'Availability deleted successfully' })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.availabilitiesService.remove(id);
  }
}