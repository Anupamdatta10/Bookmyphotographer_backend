import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PartnerCompanyStatus } from '../../schemas/partner-company.schema';

export class CreatePartnerCompanyDto {
  @ApiProperty({ example: 'Northstar Weddings', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: '/public/uploads/partner-companies/logo.png' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @ApiProperty({ example: 'Planning the moments that matter', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  description: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/northstar' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  facebookUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://instagram.com/northstar' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  instagramUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://youtube.com/@northstar' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  youtubeUrl?: string | null;

  @ApiPropertyOptional({ enum: PartnerCompanyStatus })
  @IsOptional()
  @IsEnum(PartnerCompanyStatus)
  status?: PartnerCompanyStatus;
}

export class UpdatePartnerCompanyDto {
  @ApiPropertyOptional({ example: 'Northstar Weddings', maxLength: 80 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: '/public/uploads/partner-companies/logo.png' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Planning the moments that matter', maxLength: 120 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  description?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/northstar' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  facebookUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://instagram.com/northstar' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  instagramUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://youtube.com/@northstar' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  youtubeUrl?: string | null;

  @ApiPropertyOptional({ enum: PartnerCompanyStatus })
  @IsOptional()
  @IsEnum(PartnerCompanyStatus)
  status?: PartnerCompanyStatus;
}

export class PartnerCompanyQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'wedding' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: PartnerCompanyStatus })
  @IsOptional()
  @IsEnum(PartnerCompanyStatus)
  status?: PartnerCompanyStatus;
}