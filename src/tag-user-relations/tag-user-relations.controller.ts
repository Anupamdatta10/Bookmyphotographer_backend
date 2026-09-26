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
import { TagUserRelationsService } from './tag-user-relations.service';
import { CreateTagUserRelationDto, UpdateTagUserRelationDto, TagUserRelationQueryDto } from './dto/tag-user-relation.dto';
import { TagUserRelation } from '../schemas/tag-user-relation.schema';

@ApiTags('tag-user-relations')
@Controller('tag-user-relations')
export class TagUserRelationsController {
  constructor(private readonly tagUserRelationsService: TagUserRelationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag-user relation' })
  @ApiResponse({ status: 201, description: 'Tag-User relation created successfully', type: TagUserRelation })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - relation already exists' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createDto: CreateTagUserRelationDto): Promise<TagUserRelation> {
    return this.tagUserRelationsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tag-user relations with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of tag-user relations with pagination info' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() queryDto: TagUserRelationQueryDto) {
    return this.tagUserRelationsService.findAll(queryDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get tag-user relations by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'List of tag-user relations for the user' })
  async findByUser(@Param('userId') userId: string) {
    return this.tagUserRelationsService.findByUser(userId);
  }

  @Get('tag/:tagId')
  @ApiOperation({ summary: 'Get tag-user relations by tag ID' })
  @ApiParam({ name: 'tagId', description: 'Tag ID' })
  @ApiResponse({ status: 200, description: 'List of tag-user relations for the tag' })
  async findByTag(@Param('tagId') tagId: string) {
    return this.tagUserRelationsService.findByTag(tagId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag-user relation by ID' })
  @ApiParam({ name: 'id', description: 'Tag-User Relation ID' })
  @ApiResponse({ status: 200, description: 'Tag-User relation found', type: TagUserRelation })
  @ApiResponse({ status: 404, description: 'Tag-User relation not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async findOne(@Param('id') id: string): Promise<TagUserRelation> {
    return this.tagUserRelationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tag-user relation' })
  @ApiParam({ name: 'id', description: 'Tag-User Relation ID' })
  @ApiResponse({ status: 200, description: 'Tag-User relation updated successfully', type: TagUserRelation })
  @ApiResponse({ status: 404, description: 'Tag-User relation not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 409, description: 'Conflict - relation already exists' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() updateDto: UpdateTagUserRelationDto): Promise<TagUserRelation> {
    return this.tagUserRelationsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a tag-user relation' })
  @ApiParam({ name: 'id', description: 'Tag-User Relation ID' })
  @ApiResponse({ status: 204, description: 'Tag-User relation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tag-User relation not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.tagUserRelationsService.remove(id);
  }
}