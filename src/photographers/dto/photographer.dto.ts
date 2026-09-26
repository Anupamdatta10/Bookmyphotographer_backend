import { IsString, IsEmail, IsPhoneNumber, IsArray, IsOptional, IsNumber, Min, Max, IsUrl, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePhotographerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123 Main St, City, State' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: ['Wedding', 'Portrait', 'Event'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ example: 'Professional photographer with 10 years experience' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerHour?: number;

  @ApiPropertyOptional({ example: 'https://portfolio.example.com' })
  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  @ApiPropertyOptional({ example: 'https://profile.example.com/image.jpg' })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class UpdatePhotographerDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St, City, State' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: ['Wedding', 'Portrait', 'Event'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ example: 'Professional photographer with 10 years experience' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerHour?: number;

  @ApiPropertyOptional({ example: 'https://portfolio.example.com' })
  @IsOptional()
  @IsUrl()
  portfolioUrl?: string;

  @ApiPropertyOptional({ example: 'https://profile.example.com/image.jpg' })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;
}

export class PhotographerQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'Wedding' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: 4.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ example: 'name' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;
}