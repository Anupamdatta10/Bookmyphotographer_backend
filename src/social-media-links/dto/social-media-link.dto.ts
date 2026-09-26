import { IsMongoId, IsUrl, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSocialMediaLinkDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ example: 'https://instagram.com/photographer' })
  @IsUrl()
  link: string;

  @ApiPropertyOptional({ example: 'Instagram' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  socialMediaName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/instagram-logo.png' })
  @IsOptional()
  @IsUrl()
  logo?: string;
}

export class UpdateSocialMediaLinkDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/photographer' })
  @IsOptional()
  @IsUrl()
  link?: string;

  @ApiPropertyOptional({ example: 'Instagram' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  socialMediaName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/instagram-logo.png' })
  @IsOptional()
  @IsUrl()
  logo?: string;
}

export class SocialMediaLinkQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsString()
  page?: string = '1';

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsString()
  limit?: string = '10';

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ example: 'Instagram' })
  @IsOptional()
  @IsString()
  socialMediaName?: string;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}