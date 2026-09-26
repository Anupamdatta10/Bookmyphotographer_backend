import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Availability, AvailabilityDocument } from '../schemas/availability.schema';
import { CreateAvailabilityDto, UpdateAvailabilityDto, AvailabilityQueryDto } from './dto/availability.dto';

@Injectable()
export class AvailabilitiesService {
  constructor(
    @InjectModel(Availability.name) private availabilityModel: Model<AvailabilityDocument>,
  ) {}

  async create(createDto: CreateAvailabilityDto): Promise<AvailabilityDocument> {
    // Check if availability already exists for this user-date pair
    const existingAvailability = await this.availabilityModel.findOne({
      userId: createDto.userId,
      bookDate: createDto.bookDate,
      deletedAt: { $exists: false },
    });
    if (existingAvailability) {
      throw new ConflictException('Availability for this user and date already exists');
    }

    const createdAvailability = new this.availabilityModel({
      userId: new Types.ObjectId(createDto.userId),
      bookDate: createDto.bookDate,
    });
    return createdAvailability.save();
  }

  async findAll(queryDto: AvailabilityQueryDto): Promise<{ data: AvailabilityDocument[]; total: number; page: number; limit: number }> {
    const {
      page = '1',
      limit = '10',
      userId,
      startDate,
      endDate,
      sortBy = 'bookDate',
      sortOrder = 'asc',
    } = queryDto;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Build filter query
    const filter: FilterQuery<AvailabilityDocument> = {};

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      filter.userId = new Types.ObjectId(userId);
    }

    if (startDate || endDate) {
      filter.bookDate = {};
      if (startDate) filter.bookDate.$gte = startDate;
      if (endDate) filter.bookDate.$lte = endDate;
    }

    // Exclude soft deleted
    filter.deletedAt = { $exists: false };

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [data, total] = await Promise.all([
      this.availabilityModel
        .find(filter)
        .populate('userId', 'name email')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .exec(),
      this.availabilityModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async findOne(id: string): Promise<AvailabilityDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid availability ID');
    }

    const availability = await this.availabilityModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('userId', 'name email')
      .exec();

    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }
    return availability;
  }

  async findByUser(userId: string, queryDto: AvailabilityQueryDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.findAll({ ...queryDto, userId });
  }

  async update(id: string, updateDto: UpdateAvailabilityDto): Promise<AvailabilityDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid availability ID');
    }

    const updateData: Record<string, unknown> = { ...updateDto };
    if (updateDto.userId) {
      if (!Types.ObjectId.isValid(updateDto.userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      updateData.userId = new Types.ObjectId(updateDto.userId);
    }

    // Check if new availability already exists
    if (updateDto.userId || updateDto.bookDate) {
      const availability = await this.availabilityModel.findById(id).exec();
      if (!availability) {
        throw new NotFoundException(`Availability with ID ${id} not found`);
      }

      const userId = updateDto.userId || availability.userId.toString();
      const bookDate = updateDto.bookDate || availability.bookDate;

      const existingAvailability = await this.availabilityModel.findOne({
        _id: { $ne: id },
        userId: new Types.ObjectId(userId),
        bookDate,
        deletedAt: { $exists: false },
      });
      if (existingAvailability) {
        throw new ConflictException('Availability for this user and date already exists');
      }
    }

    const updatedAvailability = await this.availabilityModel
      .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, updateData, { new: true, runValidators: true })
      .populate('userId', 'name email')
      .exec();

    if (!updatedAvailability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    return updatedAvailability;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid availability ID');
    }

    // Soft delete
    const result = await this.availabilityModel.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
      { new: true }
    ).exec();

    if (!result) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }
  }

  async getUserAvailability(userId: string, startDate: Date, endDate: Date): Promise<AvailabilityDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.availabilityModel
      .find({
        userId: new Types.ObjectId(userId),
        bookDate: { $gte: startDate, $lte: endDate },
        deletedAt: { $exists: false },
      })
      .sort({ bookDate: 1 })
      .exec();
  }
}