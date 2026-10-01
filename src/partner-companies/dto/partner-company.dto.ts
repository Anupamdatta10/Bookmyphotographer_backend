import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { PartnerCompanyStatus } from '../../schemas/partner-company.schema';

export class CreatePartnerCompanyDto {
  @ApiProperty({ example: 'Northstar Weddings', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: 'NW', maxLength: 8 })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  icon?: string;

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

  @ApiPropertyOptional({ example: 'https://linkedin.com/company/northstar' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  linkedinUrl?: string | null;

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

  @ApiPropertyOptional({ example: 'NW', maxLength: 8 })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  icon?: string;

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

  @ApiPropertyOptional({ example: 'https://linkedin.com/company/northstar' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  linkedinUrl?: string | null;

  @ApiPropertyOptional({ enum: PartnerCompanyStatus })
  @IsOptional()
  @IsEnum(PartnerCompanyStatus)
  status?: PartnerCompanyStatus;
}

export class PartnerCompanyQueryDto {
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