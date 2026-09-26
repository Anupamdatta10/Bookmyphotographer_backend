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
import { PhotoGalleriesService } from './photo-galleries.service';
import { CreatePhotoGalleryDto, UpdatePhotoGalleryDto, PhotoGalleryQueryDto } from './dto/photo-gallery.dto';
import { PhotoGallery } from '../schemas/photo-gallery.schema';

@ApiTags('photo-galleries')
@Controller('photo-galleries')
export class PhotoGalleriesController {
  constructor(private readonly photoGalleriesService: PhotoGalleriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new photo gallery entry' })
  @ApiResponse({ status: 201, description: 'Photo gallery created successfully', type: PhotoGallery })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createDto: CreatePhotoGalleryDto): Promise<PhotoGallery> {
    return this.photoGalleriesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all photo galleries with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of photo galleries with pagination info' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() queryDto: PhotoGalleryQueryDto) {
    return this.photoGalleriesService.findAll(queryDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get photo galleries for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of photo galleries for the user' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findByUser(
    @Param('userId') userId: string,
    @Query() queryDto: PhotoGalleryQueryDto,
  ) {
    return this.photoGalleriesService.findByUser(userId, queryDto);
  }

  @Get('user/:userId/profile')
  @ApiOperation({ summary: 'Get profile image for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile image' })
  async getProfileImage(@Param('userId') userId: string) {
    return this.photoGalleriesService.getProfileImage(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a photo gallery by ID' })
  @ApiParam({ name: 'id', description: 'Photo Gallery ID' })
  @ApiResponse({ status: 200, description: 'Photo gallery found', type: PhotoGallery })
  @ApiResponse({ status: 404, description: 'Photo gallery not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async findOne(@Param('id') id: string): Promise<PhotoGallery> {
    return this.photoGalleriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a photo gallery' })
  @ApiParam({ name: 'id', description: 'Photo Gallery ID' })
  @ApiResponse({ status: 200, description: 'Photo gallery updated successfully', type: PhotoGallery })
  @ApiResponse({ status: 404, description: 'Photo gallery not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() updateDto: UpdatePhotoGalleryDto): Promise<PhotoGallery> {
    return this.photoGalleriesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a photo gallery' })
  @ApiParam({ name: 'id', description: 'Photo Gallery ID' })
  @ApiResponse({ status: 204, description: 'Photo gallery deleted successfully' })
  @ApiResponse({ status: 404, description: 'Photo gallery not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.photoGalleriesService.remove(id);
  }
}