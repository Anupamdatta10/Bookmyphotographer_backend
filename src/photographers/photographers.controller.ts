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
import { PhotographersService } from './photographers.service';
import { CreatePhotographerDto, UpdatePhotographerDto, PhotographerQueryDto } from './dto/photographer.dto';
import { User } from '../schemas/user.schema';

@ApiTags('photographers')
@Controller('photographers')
export class PhotographersController {
  constructor(private readonly photographersService: PhotographersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new photographer' })
  @ApiResponse({ status: 201, description: 'Photographer created successfully', type: User })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or email already exists' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createPhotographerDto: CreatePhotographerDto): Promise<User> {
    return this.photographersService.create(createPhotographerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all photographers with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of photographers with pagination info' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() queryDto: PhotographerQueryDto) {
    return this.photographersService.findAll(queryDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get photographer statistics' })
  @ApiResponse({ status: 200, description: 'Photographer statistics' })
  async getStats() {
    return this.photographersService.getStats();
  }

  @Get('specialties')
  @ApiOperation({ summary: 'Get all available specialties' })
  @ApiResponse({ status: 200, description: 'List of specialties' })
  async getSpecialties() {
    return this.photographersService.getSpecialties();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a photographer by ID' })
  @ApiParam({ name: 'id', description: 'Photographer ID' })
  @ApiResponse({ status: 200, description: 'Photographer found', type: User })
  @ApiResponse({ status: 404, description: 'Photographer not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.photographersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a photographer' })
  @ApiParam({ name: 'id', description: 'Photographer ID' })
  @ApiResponse({ status: 200, description: 'Photographer updated successfully', type: User })
  @ApiResponse({ status: 404, description: 'Photographer not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format or email already exists' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() updatePhotographerDto: UpdatePhotographerDto): Promise<User> {
    return this.photographersService.update(id, updatePhotographerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a photographer' })
  @ApiParam({ name: 'id', description: 'Photographer ID' })
  @ApiResponse({ status: 204, description: 'Photographer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Photographer not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.photographersService.remove(id);
  }
}