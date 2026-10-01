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

@Injectable()
export class PartnerCompaniesService implements OnModuleInit {
  constructor(
    @InjectModel(PartnerCompany.name)
    private readonly partnerCompanyModel: Model<PartnerCompanyDocument>,
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
      icon: createDto.icon?.trim() || '★',
    });
    return partner.save();
  }

  async findAll(query: PartnerCompanyQueryDto): Promise<{
    data: PartnerCompanyDocument[];
    total: number;
  }> {
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
      this.partnerCompanyModel.find(filter).sort({ createdAt: -1 }).exec(),
      this.partnerCompanyModel.countDocuments(filter).exec(),
    ]);
    return { data, total };
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
      ...(updateDto.icon !== undefined
        ? { icon: updateDto.icon.trim() || '★' }
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