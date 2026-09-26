import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Photographer, PhotographerDocument } from './schemas/photographer.schema';
import { CreatePhotographerDto, UpdatePhotographerDto, PhotographerQueryDto } from './dto/photographer.dto';

@Injectable()
export class PhotographersService {
  constructor(
    @InjectModel(Photographer.name) private photographerModel: Model<PhotographerDocument>,
  ) {}

  async create(createPhotographerDto: CreatePhotographerDto): Promise<PhotographerDocument> {
    // Check if email already exists
    const existingPhotographer = await this.photographerModel.findOne({ email: createPhotographerDto.email });
    if (existingPhotographer) {
      throw new BadRequestException('Photographer with this email already exists');
    }

    const createdPhotographer = new this.photographerModel(createPhotographerDto);
    return createdPhotographer.save();
  }

  async findAll(queryDto: PhotographerQueryDto): Promise<{ data: PhotographerDocument[]; total: number; page: number; limit: number }> {
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
    const filter: FilterQuery<PhotographerDocument> = {};

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

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [data, total] = await Promise.all([
      this.photographerModel
        .find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.photographerModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<PhotographerDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid photographer ID');
    }

    const photographer = await this.photographerModel.findById(id).exec();
    if (!photographer) {
      throw new NotFoundException(`Photographer with ID ${id} not found`);
    }
    return photographer;
  }

  async findByEmail(email: string): Promise<PhotographerDocument | null> {
    return this.photographerModel.findOne({ email }).exec();
  }

  async update(id: string, updatePhotographerDto: UpdatePhotographerDto): Promise<PhotographerDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid photographer ID');
    }

    // Check if email is being updated and if it already exists
    if (updatePhotographerDto.email) {
      const existingPhotographer = await this.photographerModel.findOne({
        email: updatePhotographerDto.email,
        _id: { $ne: id },
      });
      if (existingPhotographer) {
        throw new BadRequestException('Photographer with this email already exists');
      }
    }

    const updatedPhotographer = await this.photographerModel
      .findByIdAndUpdate(id, updatePhotographerDto, { new: true, runValidators: true })
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

    const result = await this.photographerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Photographer with ID ${id} not found`);
    }
  }

  async getSpecialties(): Promise<string[]> {
    const photographers = await this.photographerModel.find({}, 'specialties').exec();
    const specialties = new Set<string>();
    photographers.forEach((p) => {
      p.specialties.forEach((s) => specialties.add(s));
    });
    return Array.from(specialties).sort();
  }

  async getStats(): Promise<{ total: number; available: number; averageRating: number; averagePrice: number }> {
    const [total, available, ratingStats, priceStats] = await Promise.all([
      this.photographerModel.countDocuments().exec(),
      this.photographerModel.countDocuments({ isAvailable: true }).exec(),
      this.photographerModel.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]).exec(),
      this.photographerModel.aggregate([
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