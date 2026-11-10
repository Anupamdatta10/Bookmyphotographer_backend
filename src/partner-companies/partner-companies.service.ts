import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  PartnerCompany,
  PartnerCompanyDocument,
  PartnerCompanyStatus,
} from '../schemas/partner-company.schema';
import {
  CreatePartnerCompanyDto,
  PartnerCompanyQueryDto,
  UpdatePartnerCompanyDto,
} from './dto/partner-company.dto';
import { FileUploadService } from '../common/services/file-upload.service';

@Injectable()
export class PartnerCompaniesService implements OnModuleInit {
  constructor(
    @InjectModel(PartnerCompany.name)
    private readonly partnerCompanyModel: Model<PartnerCompanyDocument>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.partnerCompanyModel
      .collection.updateMany({}, { $unset: { category: '' } });
  }

  async create(
    createDto: CreatePartnerCompanyDto,
  ): Promise<PartnerCompanyDocument> {
    await this.ensureUniqueName(createDto.name);
    const partner = new this.partnerCompanyModel({
      ...createDto,
      name: createDto.name.trim(),
      imageUrl: createDto.imageUrl?.trim() || '',
    });
    return partner.save();
  }

  async findAll(query: PartnerCompanyQueryDto): Promise<{
    data: PartnerCompanyDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 10);
    const filter: FilterQuery<PartnerCompanyDocument> = {
      deletedAt: { $exists: false },
    };
    if (query.status) filter.status = query.status;
    if (query.search?.trim()) {
      const search = this.escapeRegex(query.search.trim());
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.partnerCompanyModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.partnerCompanyModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<PartnerCompanyDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid partner company ID');
    }
    const partner = await this.partnerCompanyModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .exec();
    if (!partner) {
      throw new NotFoundException(`Partner company with ID ${id} not found`);
    }
    return partner;
  }

  async update(
    id: string,
    updateDto: UpdatePartnerCompanyDto,
  ): Promise<PartnerCompanyDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid partner company ID');
    }
    if (updateDto.name) await this.ensureUniqueName(updateDto.name, id);

    const updateData = {
      ...updateDto,
      ...(updateDto.name ? { name: updateDto.name.trim() } : {}),
      ...(updateDto.imageUrl !== undefined
        ? { imageUrl: updateDto.imageUrl.trim() }
        : {}),
    };
    const partner = await this.partnerCompanyModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $exists: false } },
        updateData,
        { new: true, runValidators: true },
      )
      .exec();
    if (!partner) {
      throw new NotFoundException(`Partner company with ID ${id} not found`);
    }
    return partner;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid partner company ID');
    }
    const partner = await this.partnerCompanyModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $exists: false } },
        { deletedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!partner) {
      throw new NotFoundException(`Partner company with ID ${id} not found`);
    }
    await this.removeStoredImage(partner.imageUrl);
  }

  async uploadImage(
    id: string,
    file: Express.Multer.File,
  ): Promise<PartnerCompanyDocument> {
    const partner = await this.findOne(id);
    const imageUrl = await this.fileUploadService.uploadFile(
      file,
      'partner-companies',
    );
    const oldImageUrl = partner.imageUrl;
    const updated = await this.partnerCompanyModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $exists: false } },
        { imageUrl },
        { new: true, runValidators: true },
      )
      .exec();
    if (!updated) {
      await this.fileUploadService.deleteFile(imageUrl);
      throw new NotFoundException(`Partner company with ID ${id} not found`);
    }
    if (oldImageUrl && oldImageUrl !== imageUrl) {
      await this.fileUploadService.deleteFile(oldImageUrl);
    }
    return updated;
  }

  async removeImage(id: string): Promise<PartnerCompanyDocument> {
    const partner = await this.findOne(id);
    const updated = await this.partnerCompanyModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $exists: false } },
        { imageUrl: '' },
        { new: true, runValidators: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException(`Partner company with ID ${id} not found`);
    }
    await this.removeStoredImage(partner.imageUrl);
    return updated;
  }

  private async removeStoredImage(imageUrl?: string): Promise<void> {
    if (imageUrl) await this.fileUploadService.deleteFile(imageUrl);
  }

  private async ensureUniqueName(name: string, excludedId?: string): Promise<void> {
    const filter: FilterQuery<PartnerCompanyDocument> = {
      name: { $regex: `^${this.escapeRegex(name.trim())}$`, $options: 'i' },
      deletedAt: { $exists: false },
    };
    if (excludedId) filter._id = { $ne: new Types.ObjectId(excludedId) };
    const existing = await this.partnerCompanyModel.findOne(filter).exec();
    if (existing) {
      throw new ConflictException('A partner company with this name already exists');
    }
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}