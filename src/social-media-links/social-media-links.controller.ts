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
import { SocialMediaLinksService } from './social-media-links.service';
import { CreateSocialMediaLinkDto, UpdateSocialMediaLinkDto, SocialMediaLinkQueryDto } from './dto/social-media-link.dto';
import { SocialMediaLink } from '../schemas/social-media-link.schema';

@ApiTags('social-media-links')
@Controller('social-media-links')
export class SocialMediaLinksController {
  constructor(private readonly socialMediaLinksService: SocialMediaLinksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new social media link' })
  @ApiResponse({ status: 201, description: 'Social media link created successfully', type: SocialMediaLink })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createDto: CreateSocialMediaLinkDto): Promise<SocialMediaLink> {
    return this.socialMediaLinksService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all social media links with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of social media links with pagination info' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() queryDto: SocialMediaLinkQueryDto) {
    return this.socialMediaLinksService.findAll(queryDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get social media links for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of social media links for the user' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findByUser(
    @Param('userId') userId: string,
    @Query() queryDto: SocialMediaLinkQueryDto,
  ) {
    return this.socialMediaLinksService.findByUser(userId, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a social media link by ID' })
  @ApiParam({ name: 'id', description: 'Social Media Link ID' })
  @ApiResponse({ status: 200, description: 'Social media link found', type: SocialMediaLink })
  @ApiResponse({ status: 404, description: 'Social media link not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async findOne(@Param('id') id: string): Promise<SocialMediaLink> {
    return this.socialMediaLinksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a social media link' })
  @ApiParam({ name: 'id', description: 'Social Media Link ID' })
  @ApiResponse({ status: 200, description: 'Social media link updated successfully', type: SocialMediaLink })
  @ApiResponse({ status: 404, description: 'Social media link not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() updateDto: UpdateSocialMediaLinkDto): Promise<SocialMediaLink> {
    return this.socialMediaLinksService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a social media link' })
  @ApiParam({ name: 'id', description: 'Social Media Link ID' })
  @ApiResponse({ status: 204, description: 'Social media link deleted successfully' })
  @ApiResponse({ status: 404, description: 'Social media link not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.socialMediaLinksService.remove(id);
  }
}