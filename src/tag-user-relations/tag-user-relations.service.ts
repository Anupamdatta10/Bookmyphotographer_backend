import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { TagUserRelation, TagUserRelationDocument } from '../schemas/tag-user-relation.schema';
import { CreateTagUserRelationDto, UpdateTagUserRelationDto, TagUserRelationQueryDto } from './dto/tag-user-relation.dto';

@Injectable()
export class TagUserRelationsService {
  constructor(
    @InjectModel(TagUserRelation.name) private tagUserRelationModel: Model<TagUserRelationDocument>,
  ) {}

  async create(createDto: CreateTagUserRelationDto): Promise<TagUserRelationDocument> {
    // Check if relation already exists
    const existingRelation = await this.tagUserRelationModel.findOne({
      userId: createDto.userId,
      tagId: createDto.tagId,
      deletedAt: { $exists: false },
    });
    if (existingRelation) {
      throw new ConflictException('Tag-User relation already exists');
    }

    const createdRelation = new this.tagUserRelationModel({
      userId: new Types.ObjectId(createDto.userId),
      tagId: new Types.ObjectId(createDto.tagId),
    });
    return createdRelation.save();
  }

  async findAll(queryDto: TagUserRelationQueryDto): Promise<{ data: TagUserRelationDocument[]; total: number; page: number; limit: number }> {
    const {
      page = '1',
      limit = '10',
      userId,
      tagId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Build filter query
    const filter: FilterQuery<TagUserRelationDocument> = {};

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      filter.userId = new Types.ObjectId(userId);
    }

    if (tagId) {
      if (!Types.ObjectId.isValid(tagId)) {
        throw new BadRequestException('Invalid tag ID');
      }
      filter.tagId = new Types.ObjectId(tagId);
    }

    // Exclude soft deleted
    filter.deletedAt = { $exists: false };

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [data, total] = await Promise.all([
      this.tagUserRelationModel
        .find(filter)
        .populate('userId', 'name email')
        .populate('tagId', 'name')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .exec(),
      this.tagUserRelationModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async findOne(id: string): Promise<TagUserRelationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid tag-user relation ID');
    }

    const relation = await this.tagUserRelationModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('userId', 'name email')
      .populate('tagId', 'name')
      .exec();

    if (!relation) {
      throw new NotFoundException(`Tag-User relation with ID ${id} not found`);
    }
    return relation;
  }

  async findByUser(userId: string): Promise<TagUserRelationDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.tagUserRelationModel
      .find({ userId: new Types.ObjectId(userId), deletedAt: { $exists: false } })
      .populate('tagId', 'name')
      .exec();
  }

  async findByTag(tagId: string): Promise<TagUserRelationDocument[]> {
    if (!Types.ObjectId.isValid(tagId)) {
      throw new BadRequestException('Invalid tag ID');
    }

    return this.tagUserRelationModel
      .find({ tagId: new Types.ObjectId(tagId), deletedAt: { $exists: false } })
      .populate('userId', 'name email')
      .exec();
  }

  async update(id: string, updateDto: UpdateTagUserRelationDto): Promise<TagUserRelationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid tag-user relation ID');
    }

    const updateData: Record<string, unknown> = { ...updateDto };
    if (updateDto.userId) {
      if (!Types.ObjectId.isValid(updateDto.userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      updateData.userId = new Types.ObjectId(updateDto.userId);
    }
    if (updateDto.tagId) {
      if (!Types.ObjectId.isValid(updateDto.tagId)) {
        throw new BadRequestException('Invalid tag ID');
      }
      updateData.tagId = new Types.ObjectId(updateDto.tagId);
    }

    // Check if new relation already exists
    if (updateDto.userId || updateDto.tagId) {
      const relation = await this.tagUserRelationModel.findById(id).exec();
      if (!relation) {
        throw new NotFoundException(`Tag-User relation with ID ${id} not found`);
      }

      const userId = updateDto.userId || relation.userId.toString();
      const tagId = updateDto.tagId || relation.tagId.toString();

      const existingRelation = await this.tagUserRelationModel.findOne({
        _id: { $ne: id },
        userId: new Types.ObjectId(userId),
        tagId: new Types.ObjectId(tagId),
        deletedAt: { $exists: false },
      });
      if (existingRelation) {
        throw new ConflictException('Tag-User relation already exists');
      }
    }

    const updatedRelation = await this.tagUserRelationModel
      .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, updateData, { new: true, runValidators: true })
      .populate('userId', 'name email')
      .populate('tagId', 'name')
      .exec();

    if (!updatedRelation) {
      throw new NotFoundException(`Tag-User relation with ID ${id} not found`);
    }

    return updatedRelation;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid tag-user relation ID');
    }

    // Soft delete
    const result = await this.tagUserRelationModel.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
      { new: true }
    ).exec();

    if (!result) {
      throw new NotFoundException(`Tag-User relation with ID ${id} not found`);
    }
  }
}