import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { PhotoGallery, PhotoGalleryDocument } from '../schemas/photo-gallery.schema';
import { CreatePhotoGalleryDto, UpdatePhotoGalleryDto, PhotoGalleryQueryDto } from './dto/photo-gallery.dto';
import { FileUploadService } from '@/common/services/file-upload.service';

@Injectable()
export class PhotoGalleriesService {
  constructor(
    @InjectModel(PhotoGallery.name) private photoGalleryModel: Model<PhotoGalleryDocument>,
    private fileUploadService: FileUploadService,
  ) {}

  async create(createDto: CreatePhotoGalleryDto, file?: Express.Multer.File): Promise<PhotoGalleryDocument> {
    // If this is set as profile image, unset other profile images for this user
    if (createDto.isProfileImage) {
      await this.photoGalleryModel.updateMany(
        { userId: new Types.ObjectId(createDto.userId), isProfileImage: true, deletedAt: { $exists: false } },
        { isProfileImage: false }
      ).exec();
    }

    // Upload file if provided
    let link = '';
    if (file) {
      link = await this.fileUploadService.uploadFile(file, 'galleries');
    }

    const createdPhoto = new this.photoGalleryModel({
      ...createDto,
      userId: new Types.ObjectId(createDto.userId),
      link,
    });
    return createdPhoto.save();
  }

  async findAll(queryDto: PhotoGalleryQueryDto): Promise<{ data: PhotoGalleryDocument[]; total: number; page: number; limit: number }> {
    const {
      page = '1',
      limit = '10',
      userId,
      isProfileImage,
      sortBy = 'sequence',
      sortOrder = 'asc',
    } = queryDto;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Build filter query
    const filter: FilterQuery<PhotoGalleryDocument> = {};

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      filter.userId = new Types.ObjectId(userId);
    }

    if (isProfileImage !== undefined) {
      filter.isProfileImage = String(isProfileImage) === 'true';
    }

    // Exclude soft deleted
    filter.deletedAt = { $exists: false };

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [data, total] = await Promise.all([
      this.photoGalleryModel
        .find(filter)
        .populate('userId', 'name email')
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .exec(),
      this.photoGalleryModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async findOne(id: string): Promise<PhotoGalleryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid photo gallery ID');
    }

    const photo = await this.photoGalleryModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('userId', 'name email')
      .exec();

    if (!photo) {
      throw new NotFoundException(`Photo gallery with ID ${id} not found`);
    }
    return photo;
  }

  async findByUser(userId: string, queryDto: PhotoGalleryQueryDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.findAll({ ...queryDto, userId });
  }

  async getProfileImage(userId: string): Promise<PhotoGalleryDocument | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.photoGalleryModel
      .findOne({ userId: new Types.ObjectId(userId), isProfileImage: true, deletedAt: { $exists: false } })
      .exec();
  }

  async update(id: string, updateDto: UpdatePhotoGalleryDto, file?: Express.Multer.File): Promise<PhotoGalleryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid photo gallery ID');
    }

    const updateData: Record<string, unknown> = { ...updateDto };
    if (updateDto.userId) {
      if (!Types.ObjectId.isValid(updateDto.userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      updateData.userId = new Types.ObjectId(updateDto.userId);
    }

    // If this is being set as profile image, unset other profile images for this user
    if (updateDto.isProfileImage) {
      const photo = await this.photoGalleryModel.findById(id).exec();
      if (photo) {
        await this.photoGalleryModel.updateMany(
          { userId: photo.userId, isProfileImage: true, _id: { $ne: id }, deletedAt: { $exists: false } },
          { isProfileImage: false }
        ).exec();
      }
    }

    // Upload new file if provided
    if (file) {
      // Delete old file if exists
      const oldPhoto = await this.photoGalleryModel.findById(id).exec();
      if (oldPhoto?.link) {
        await this.fileUploadService.deleteFile(oldPhoto.link);
      }
      updateData.link = await this.fileUploadService.uploadFile(file, 'galleries');
    }

    const updatedPhoto = await this.photoGalleryModel
      .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, updateData, { new: true, runValidators: true })
      .populate('userId', 'name email')
      .exec();

    if (!updatedPhoto) {
      throw new NotFoundException(`Photo gallery with ID ${id} not found`);
    }

    return updatedPhoto;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid photo gallery ID');
    }

    // Delete associated file
    const photo = await this.photoGalleryModel.findById(id).exec();
    if (photo?.link) {
      await this.fileUploadService.deleteFile(photo.link);
    }

    // Soft delete
    const result = await this.photoGalleryModel.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
      { new: true }
    ).exec();

    if (!result) {
      throw new NotFoundException(`Photo gallery with ID ${id} not found`);
    }
  }
}