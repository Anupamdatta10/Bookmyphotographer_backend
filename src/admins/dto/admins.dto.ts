import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ example: 'Alex Morgan', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ minLength: 8, maxLength: 50 })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;
}

export class UpdateAdminProfileDto {
  @ApiPropertyOptional({ example: 'Alex Morgan', minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '+1 555 0100', maxLength: 40 })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @ApiPropertyOptional({ example: 'United States', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string | null;

  @ApiPropertyOptional({ example: 'California', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string | null;

  @ApiPropertyOptional({ example: 'San Francisco', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string | null;

  @ApiPropertyOptional({ example: '10 Market Street', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string | null;

  @ApiPropertyOptional({ example: '/public/admins/alex.jpg', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImageUrl?: string | null;
}

export class AdminQueryDto {
  @ApiPropertyOptional({ example: 'alex' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}