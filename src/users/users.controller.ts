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
import { CreateUserFirstDto, CreateUserSecondDto, UpdateUserDto, UpdateOccupiedDatesDto, UpdateUserStatusDto, UserQueryDto, LoginDto, VerifyOtpDto } from './dto/user.dto';
import { User, UserRole } from '../schemas/user.schema';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('signup')
  @ApiOperation({ summary: 'Create user first step - name, email, password only' })
  @ApiResponse({ status: 201, description: 'User first step data received' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createFirst(@Body() createUserFirstDto: CreateUserFirstDto) {
    console.log('First endpoint data:', {
      name: createUserFirstDto.name,
      email: createUserFirstDto.email,
    });
    return this.usersService.sendRegistrationOtp(createUserFirstDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify registration email OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired verification code' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.usersService.verifyRegistrationOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Post('profileSetup')
  @ApiOperation({ summary: 'Submit user profile details and profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        type: { type: 'string', enum: ['ADMIN', 'PHOTOGRAPHER', 'PARTNER', 'SUPER-ADMIN'] },
        phone: { type: 'string' },
        city: { type: 'string' },
        country: { type: 'string' },
        state: { type: 'string' },
        address1: { type: 'string' },
        address2: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({ status: 201, description: 'User second step data received' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({ transform: true }))
  async createSecond(
    @Body() createUserSecondDto: CreateUserSecondDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('Second endpoint data:', createUserSecondDto);
    return this.usersService.createSecondStep(createUserSecondDto, file);
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
  @ApiOperation({ summary: 'Update user details' })
  @ApiConsumes('application/json')
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
      },
    },
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 409, description: 'Conflict - email already exists' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/profile-picture')
  @ApiOperation({ summary: 'Update user profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile picture updated successfully', type: User })
  @UseInterceptors(FileInterceptor('file'))
  async updateProfilePicture(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<User> {
    return this.usersService.updateProfilePicture(id, file);
  }

  @Patch(':id/occupied-dates')
  @ApiOperation({ summary: 'Replace a user\'s occupied dates' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Occupied dates updated successfully', type: User })
  @ApiResponse({ status: 400, description: 'Invalid user ID or date list' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateOccupiedDates(
    @Param('id') id: string,
    @Body() updateDto: UpdateOccupiedDatesDto,
  ): Promise<User> {
    return this.usersService.updateOccupiedDates(id, updateDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update a photographer approval status' })
  @ApiParam({ name: 'id', description: 'Photographer user ID' })
  @ApiResponse({ status: 200, description: 'Photographer status updated successfully', type: User })
  @ApiResponse({ status: 400, description: 'Invalid photographer ID or status' })
  @ApiResponse({ status: 404, description: 'Photographer not found' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updatePhotographerStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserStatusDto,
  ): Promise<User> {
    return this.usersService.updatePhotographerStatus(id, updateDto.status);
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