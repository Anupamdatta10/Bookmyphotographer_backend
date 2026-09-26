import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Tag, TagDocument } from '../schemas/tag.schema';
import { CreateTagDto, UpdateTagDto, TagQueryDto } from './dto/tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<TagDocument> {
    // Check if tag name already exists
    const existingTag = await this.tagModel.findOne({ name: createTagDto.name, deletedAt: { $exists: false } });
    if (existingTag) {
      throw new ConflictException('Tag with this name already exists');
    }

    const createdTag = new this.tagModel(createTagDto);
    return createdTag.save();
  }

  async findAll(queryDto: TagQueryDto): Promise<{ data: TagDocument[]; total: number; page: number; limit: number }> {
    const {
      page = '1',
      limit = '10',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Build filter query
    const filter: FilterQuery<TagDocument> = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Exclude soft deleted
    filter.deletedAt = { $exists: false };

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [data, total] = await Promise.all([
      this.tagModel
        .find(filter)
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .exec(),
      this.tagModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async findOne(id: string): Promise<TagDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid tag ID');
    }

    const tag = await this.tagModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<TagDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid tag ID');
    }

    // Check if name is being updated and if it already exists
    if (updateTagDto.name) {
      const existingTag = await this.tagModel.findOne({
        name: updateTagDto.name,
        _id: { $ne: id },
        deletedAt: { $exists: false },
      });
      if (existingTag) {
        throw new ConflictException('Tag with this name already exists');
      }
    }

    const updatedTag = await this.tagModel
      .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, updateTagDto, { new: true, runValidators: true })
      .exec();

    if (!updatedTag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return updatedTag;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid tag ID');
    }

    // Soft delete
    const result = await this.tagModel.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
      { new: true }
    ).exec();

    if (!result) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
  }

  async getAllTags(): Promise<TagDocument[]> {
    return this.tagModel.find({ deletedAt: { $exists: false } }).sort({ name: 1 }).exec();
  }
}