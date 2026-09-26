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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto, LoginDto } from './dto/user.dto';
import { User, UserRole } from '../schemas/user.schema';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user with optional profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        password: { type: 'string', example: 'securePassword123' },
        type: { type: 'string', enum: ['ADMIN', 'PHOTOGRAPHER', 'PARTNER', 'SUPERADMIN'], example: 'PARTNER' },
        phone: { type: 'string', example: '+1234567890' },
        city: { type: 'string', example: 'New York' },
        country: { type: 'string', example: 'USA' },
        address1: { type: 'string', example: '123 Main St' },
        address2: { type: 'string', example: 'Apt 4B' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['name', 'email', 'password'],
    },
  })
  @ApiResponse({ status: 201, description: 'User created successfully', type: User })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - email already exists' })
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<User> {
    return this.usersService.create(createUserDto, file);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful', type: User })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() loginDto: LoginDto): Promise<User | null> {
    return this.usersService.validateUser(loginDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of users with pagination info' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() queryDto: UserQueryDto) {
    return this.usersService.findAll(queryDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  async getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user with optional profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'john.doe@example.com' },
        password: { type: 'string', example: 'securePassword123' },
        type: { type: 'string', enum: ['ADMIN', 'PHOTOGRAPHER', 'PARTNER', 'SUPERADMIN'], example: 'PARTNER' },
        phone: { type: 'string', example: '+1234567890' },
        city: { type: 'string', example: 'New York' },
        country: { type: 'string', example: 'USA' },
        address1: { type: 'string', example: '123 Main St' },
        address2: { type: 'string', example: 'Apt 4B' },
        isActive: { type: 'boolean', example: true },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 409, description: 'Conflict - email already exists' })
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}