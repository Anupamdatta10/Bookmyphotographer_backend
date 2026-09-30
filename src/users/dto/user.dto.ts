import { ArrayUnique, IsString, IsEmail, IsOptional, IsEnum, MinLength, MaxLength, IsUrl, IsBoolean, Matches, IsNumber, Min, Max, IsArray, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRole, UserStatus } from '../../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.PARTNER })
  @IsOptional()
  @IsEnum(UserRole)
  type?: UserRole;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  address1?: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiPropertyOptional({ example: 'https://profile.example.com/image.jpg' })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;
}

export class CreateUserFirstDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;
}

export class CreateUserSecondDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.PARTNER })
  @IsOptional()
  @IsEnum(UserRole)
  type?: UserRole;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'California' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  address1?: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiPropertyOptional({ example: 37.7749, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: -122.4194, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/)
  otp: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'securePassword123' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.PARTNER })
  @IsOptional()
  @IsEnum(UserRole)
  type?: UserRole;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'California' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  address1?: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiPropertyOptional({ example: ['weddings', 'portraits'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ example: 'Photographer based in California' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'I have worked with clients for several years.' })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({ example: 5, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({ example: 'https://portfolio.example.com' })
  @IsOptional()
  @IsString()
  portfolioUrl?: string;

  @ApiPropertyOptional({ example: 'Photographer' })
  @IsOptional()
  @IsString()
  proffession?: string;

  @ApiPropertyOptional({ example: 90210, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pincode?: number;

  @ApiPropertyOptional({ example: '1990-01-31', type: String })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({
    example: { type: 'Point', coordinates: [-122.4194, 37.7749] },
  })
  @IsOptional()
  @IsObject()
  location?: { type: 'Point'; coordinates: [number, number] };

  @ApiPropertyOptional({ example: 'https://profile.example.com/image.jpg' })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateOccupiedDatesDto {
  @ApiProperty({
    example: ['2026-10-05T00:00:00.000Z', '2026-10-12T00:00:00.000Z'],
    type: [String],
    description: 'ISO 8601 dates; sending an empty array clears all occupied dates.',
  })
  @IsArray()
  @ArrayUnique()
  @IsDateString({}, { each: true })
  occupiedDates: string[];
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  status: UserStatus;
}

export class UserQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsString()
  page?: string = '1';

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsString()
  limit?: string = '10';

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.PARTNER })
  @IsOptional()
  @IsEnum(UserRole)
  type?: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  password: string;
}