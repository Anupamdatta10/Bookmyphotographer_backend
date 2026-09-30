import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole, UserStatus } from '../schemas/user.schema';
import { CreatePhotographerDto, UpdatePhotographerDto, PhotographerQueryDto } from './dto/photographer.dto';

@Injectable()
export class PhotographersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createPhotographerDto: CreatePhotographerDto): Promise<UserDocument> {
    // Check if email already exists
    const email = createPhotographerDto.email.toLowerCase();
    const existingPhotographer = await this.userModel.findOne({
      email,
      deletedAt: { $exists: false }
    });
    if (existingPhotographer) {
      throw new BadRequestException('Photographer with this email already exists');
    }

    const { password, ...profile } = createPhotographerDto;
    const createdPhotographer = new this.userModel({
      ...profile,
      email,
      password: await bcrypt.hash(password, 12),
      type: UserRole.PHOTOGRAPHER,
    });
    return createdPhotographer.save();
  }

  async findAll(queryDto: PhotographerQueryDto): Promise<{ data: UserDocument[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 10,
      specialty,
      isAvailable,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = queryDto;

    // Build filter query
    const filter: FilterQuery<UserDocument> = {
      type: UserRole.PHOTOGRAPHER,
      status: UserStatus.ACTIVE,
    };

    if (specialty) {
      filter.specialties = { $in: [specialty] };
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.pricePerHour = {};
      if (minPrice !== undefined) filter.pricePerHour.$gte = minPrice;
      if (maxPrice !== undefined) filter.pricePerHour.$lte = maxPrice;
    }

    if (minRating !== undefined) {
      filter.rating = { $gte: minRating };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { specialties: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Exclude soft deleted
    filter.deletedAt = { $exists: false };

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid photographer ID');
    }

    const photographer = await this.userModel.findOne({ _id: id, type: UserRole.PHOTOGRAPHER, deletedAt: { $exists: false } }).select('-password').exec();
    if (!photographer) {
      throw new NotFoundException(`Photographer with ID ${id} not found`);
    }
    return photographer;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase(), type: UserRole.PHOTOGRAPHER, deletedAt: { $exists: false } }).select('-password').exec();
  }

  async update(id: string, updatePhotographerDto: UpdatePhotographerDto): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid photographer ID');
    }

    // Check if email is being updated and if it already exists
    if (updatePhotographerDto.email) {
      const existingPhotographer = await this.userModel.findOne({
        email: updatePhotographerDto.email.toLowerCase(),
        _id: { $ne: id },
        deletedAt: { $exists: false },
      });
      if (existingPhotographer) {
        throw new BadRequestException('Photographer with this email already exists');
      }
    }

    const updateData = {
      ...updatePhotographerDto,
      ...(updatePhotographerDto.email ? { email: updatePhotographerDto.email.toLowerCase() } : {}),
    };
    const updatedPhotographer = await this.userModel
      .findOneAndUpdate({ _id: id, type: UserRole.PHOTOGRAPHER, deletedAt: { $exists: false } }, updateData, { new: true, runValidators: true })
      .select('-password')
      .exec();

    if (!updatedPhotographer) {
      throw new NotFoundException(`Photographer with ID ${id} not found`);
    }

    return updatedPhotographer;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid photographer ID');
    }

    // Soft delete
    const result = await this.userModel.findOneAndUpdate(
      { _id: id, type: UserRole.PHOTOGRAPHER, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
      { new: true }
    ).exec();

    if (!result) {
      throw new NotFoundException(`Photographer with ID ${id} not found`);
    }
  }

  async getSpecialties(): Promise<string[]> {
    const photographers = await this.userModel.find({ type: UserRole.PHOTOGRAPHER, deletedAt: { $exists: false } }, 'specialties').exec();
    const specialties = new Set<string>();
    photographers.forEach((p) => {
      p.specialties.forEach((s) => specialties.add(s));
    });
    return Array.from(specialties).sort();
  }

  async getStats(): Promise<{ total: number; available: number; averageRating: number; averagePrice: number }> {
    const [total, available, ratingStats, priceStats] = await Promise.all([
      this.userModel.countDocuments({ type: UserRole.PHOTOGRAPHER, deletedAt: { $exists: false } }).exec(),
      this.userModel.countDocuments({ type: UserRole.PHOTOGRAPHER, isAvailable: true, deletedAt: { $exists: false } }).exec(),
      this.userModel.aggregate([
        { $match: { type: UserRole.PHOTOGRAPHER, deletedAt: { $exists: false } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]).exec(),
      this.userModel.aggregate([
        { $match: { type: UserRole.PHOTOGRAPHER, deletedAt: { $exists: false } } },
        { $group: { _id: null, avgPrice: { $avg: '$pricePerHour' } } },
      ]).exec(),
    ]);

    return {
      total,
      available,
      averageRating: ratingStats[0]?.avgRating || 0,
      averagePrice: priceStats[0]?.avgPrice || 0,
    };
  }
}