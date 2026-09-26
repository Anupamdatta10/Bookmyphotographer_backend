import { IsString, IsDate, IsEnum, IsOptional, IsNumber, Min, Max, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BookingStatus } from '../../schemas/booking.schema';

export class CreateBookingDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  photographerId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ example: '2024-06-15T10:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  eventDate: Date;

  @ApiProperty({ example: '123 Main St, City, State' })
  @IsString()
  eventLocation: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durationHours?: number;

  @ApiPropertyOptional({ example: 600 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalPrice?: number;

  @ApiPropertyOptional({ example: 'Outdoor wedding ceremony' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Need drone shots' })
  @IsOptional()
  @IsString()
  specialRequirements?: string;
}

export class UpdateBookingDto {
  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  photographerId?: string;

  @ApiPropertyOptional({ example: '2024-06-15T10:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  eventDate?: Date;

  @ApiPropertyOptional({ example: '123 Main St, City, State' })
  @IsOptional()
  @IsString()
  eventLocation?: string;

  @ApiPropertyOptional({ enum: BookingStatus, example: BookingStatus.CONFIRMED })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  durationHours?: number;

  @ApiPropertyOptional({ example: 600 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalPrice?: number;

  @ApiPropertyOptional({ example: 'Outdoor wedding ceremony' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Need drone shots' })
  @IsOptional()
  @IsString()
  specialRequirements?: string;

  @ApiPropertyOptional({ example: 'Client requested cancellation' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class BookingQueryDto {
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

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  photographerId?: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012' })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ enum: BookingStatus, example: BookingStatus.PENDING })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ example: '2024-06-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2024-06-30T23:59:59.999Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ example: 'eventDate' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'eventDate';

  @ApiPropertyOptional({ example: 'asc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}