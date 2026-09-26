import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { CreateReviewDto, UpdateReviewDto, ReviewQueryDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async create(createDto: CreateReviewDto): Promise<ReviewDocument> {
    // Check if review already exists for this user-photographer pair
    const existingReview = await this.reviewModel.findOne({
      userId: createDto.userId,
      photographerId: createDto.photographerId,
      deletedAt: { $exists: false },
    });
    if (existingReview) {
      throw new ConflictException('Review for this user-photographer pair already exists');
    }

    const createdReview = new this.reviewModel({
      ...createDto,
      userId: new Types.ObjectId(createDto.userId),
      photographerId: new Types.ObjectId(createDto.photographerId),
    });
    return createdReview.save();
  }

  async findAll(queryDto: ReviewQueryDto): Promise<{ data: ReviewDocument[]; total: number; page: number; limit: number }> {
    const {
      page = '1',
      limit = '10',
      userId,
      photographerId,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Build filter query
    const filter: FilterQuery<ReviewDocument> = {};

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      filter.userId = new Types.ObjectId(userId);
    }

    if (photographerId) {
      if (!Types.ObjectId.isValid(photographerId)) {
        throw new BadRequestException('Invalid photographer ID');
      }
      filter.photographerId = new Types.ObjectId(photographerId);
    }

    if (minRating !== undefined) {
      filter.rating = { $gte: minRating };
    }

    // Exclude soft deleted
    filter.deletedAt = { $exists: false };

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [data, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('userId', 'name email profileImageUrl')
        .populate('photographerId', 'name email profileImageUrl')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async findOne(id: string): Promise<ReviewDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid review ID');
    }

    const review = await this.reviewModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('userId', 'name email profileImageUrl')
      .populate('photographerId', 'name email profileImageUrl')
      .exec();

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async findByPhotographer(photographerId: string, queryDto: ReviewQueryDto) {
    if (!Types.ObjectId.isValid(photographerId)) {
      throw new BadRequestException('Invalid photographer ID');
    }
    return this.findAll({ ...queryDto, photographerId });
  }

  async findByUser(userId: string, queryDto: ReviewQueryDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.findAll({ ...queryDto, userId });
  }

  async update(id: string, updateDto: UpdateReviewDto): Promise<ReviewDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid review ID');
    }

    const updatedReview = await this.reviewModel
      .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, updateDto, { new: true, runValidators: true })
      .populate('userId', 'name email profileImageUrl')
      .populate('photographerId', 'name email profileImageUrl')
      .exec();

    if (!updatedReview) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return updatedReview;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid review ID');
    }

    // Soft delete
    const result = await this.reviewModel.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
      { new: true }
    ).exec();

    if (!result) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
  }

  async getPhotographerStats(photographerId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  }> {
    if (!Types.ObjectId.isValid(photographerId)) {
      throw new BadRequestException('Invalid photographer ID');
    }

    const [totalReviews, avgRating, distribution] = await Promise.all([
      this.reviewModel.countDocuments({ photographerId: new Types.ObjectId(photographerId), deletedAt: { $exists: false } }).exec(),
      this.reviewModel.aggregate([
        { $match: { photographerId: new Types.ObjectId(photographerId), deletedAt: { $exists: false } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]).exec(),
      this.reviewModel.aggregate([
        { $match: { photographerId: new Types.ObjectId(photographerId), deletedAt: { $exists: false } } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]).exec(),
    ]);

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((item) => {
      ratingDistribution[item._id] = item.count;
    });

    return {
      totalReviews,
      averageRating: avgRating[0]?.avgRating || 0,
      ratingDistribution,
    };
  }
}