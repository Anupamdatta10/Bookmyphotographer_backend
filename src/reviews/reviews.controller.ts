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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto, ReviewQueryDto } from './dto/review.dto';
import { Review } from '../schemas/review.schema';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, description: 'Review created successfully', type: Review })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - review already exists' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createDto: CreateReviewDto): Promise<Review> {
    return this.reviewsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of reviews with pagination info' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() queryDto: ReviewQueryDto) {
    return this.reviewsService.findAll(queryDto);
  }

  @Get('photographer/:photographerId')
  @ApiOperation({ summary: 'Get reviews for a specific photographer' })
  @ApiParam({ name: 'photographerId', description: 'Photographer ID' })
  @ApiResponse({ status: 200, description: 'List of reviews for the photographer' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findByPhotographer(
    @Param('photographerId') photographerId: string,
    @Query() queryDto: ReviewQueryDto,
  ) {
    return this.reviewsService.findByPhotographer(photographerId, queryDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reviews by a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of reviews by the user' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findByUser(
    @Param('userId') userId: string,
    @Query() queryDto: ReviewQueryDto,
  ) {
    return this.reviewsService.findByUser(userId, queryDto);
  }

  @Get('photographer/:photographerId/stats')
  @ApiOperation({ summary: 'Get review statistics for a photographer' })
  @ApiParam({ name: 'photographerId', description: 'Photographer ID' })
  @ApiResponse({ status: 200, description: 'Review statistics' })
  async getPhotographerStats(@Param('photographerId') photographerId: string) {
    return this.reviewsService.getPhotographerStats(photographerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review found', type: Review })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async findOne(@Param('id') id: string): Promise<Review> {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review updated successfully', type: Review })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() updateDto: UpdateReviewDto): Promise<Review> {
    return this.reviewsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 204, description: 'Review deleted successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.reviewsService.remove(id);
  }
}