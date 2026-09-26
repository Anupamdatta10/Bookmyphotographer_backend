import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { SocialMediaLink, SocialMediaLinkDocument } from '../schemas/social-media-link.schema';
import { CreateSocialMediaLinkDto, UpdateSocialMediaLinkDto, SocialMediaLinkQueryDto } from './dto/social-media-link.dto';

@Injectable()
export class SocialMediaLinksService {
  constructor(
    @InjectModel(SocialMediaLink.name) private socialMediaLinkModel: Model<SocialMediaLinkDocument>,
  ) {}

  async create(createDto: CreateSocialMediaLinkDto): Promise<SocialMediaLinkDocument> {
    const createdLink = new this.socialMediaLinkModel({
      ...createDto,
      userId: new Types.ObjectId(createDto.userId),
    });
    return createdLink.save();
  }

  async findAll(queryDto: SocialMediaLinkQueryDto): Promise<{ data: SocialMediaLinkDocument[]; total: number; page: number; limit: number }> {
    const {
      page = '1',
      limit = '10',
      userId,
      socialMediaName,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Build filter query
    const filter: FilterQuery<SocialMediaLinkDocument> = {};

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      filter.userId = new Types.ObjectId(userId);
    }

    if (socialMediaName) {
      filter.socialMediaName = { $regex: socialMediaName, $options: 'i' };
    }

    // Exclude soft deleted
    filter.deletedAt = { $exists: false };

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [data, total] = await Promise.all([
      this.socialMediaLinkModel
        .find(filter)
        .populate('userId', 'name email')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .exec(),
      this.socialMediaLinkModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async findOne(id: string): Promise<SocialMediaLinkDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid social media link ID');
    }

    const link = await this.socialMediaLinkModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('userId', 'name email')
      .exec();

    if (!link) {
      throw new NotFoundException(`Social media link with ID ${id} not found`);
    }
    return link;
  }

  async findByUser(userId: string, queryDto: SocialMediaLinkQueryDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.findAll({ ...queryDto, userId });
  }

  async update(id: string, updateDto: UpdateSocialMediaLinkDto): Promise<SocialMediaLinkDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid social media link ID');
    }

    const updateData: Record<string, unknown> = { ...updateDto };
    if (updateDto.userId) {
      if (!Types.ObjectId.isValid(updateDto.userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      updateData.userId = new Types.ObjectId(updateDto.userId);
    }

    const updatedLink = await this.socialMediaLinkModel
      .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, updateData, { new: true, runValidators: true })
      .populate('userId', 'name email')
      .exec();

    if (!updatedLink) {
      throw new NotFoundException(`Social media link with ID ${id} not found`);
    }

    return updatedLink;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid social media link ID');
    }

    // Soft delete
    const result = await this.socialMediaLinkModel.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
      { new: true }
    ).exec();

    if (!result) {
      throw new NotFoundException(`Social media link with ID ${id} not found`);
    }
  }
}