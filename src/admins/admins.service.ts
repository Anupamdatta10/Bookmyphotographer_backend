import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { FilterQuery, Model, Types } from 'mongoose';
import { Admin, AdminDocument, AdminType } from '../schemas/admin.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import {
  AdminQueryDto,
  CreateAdminDto,
  UpdateAdminProfileDto,
} from './dto/admins.dto';

@Injectable()
export class AdminsService implements OnModuleInit {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    const legacySuperAdmins = await this.userModel
      .find({ type: UserRole.SUPERADMIN, deletedAt: { $exists: false } })
      .select('+password')
      .exec();

    for (const legacyAdmin of legacySuperAdmins) {
      const existingAdmin = await this.adminModel
        .findOne({ email: legacyAdmin.email })
        .select('_id')
        .exec();
      if (!existingAdmin) {
        await this.adminModel.create({
          _id: legacyAdmin._id,
          name: legacyAdmin.name,
          email: legacyAdmin.email,
          password: legacyAdmin.password,
          type: AdminType.SUPERADMIN,
          phone: legacyAdmin.phone || null,
          country: legacyAdmin.country || null,
          state: legacyAdmin.state || null,
          city: legacyAdmin.city || null,
          address: [legacyAdmin.address1, legacyAdmin.address2]
            .filter(Boolean)
            .join(', ') || null,
          profileImageUrl: legacyAdmin.profileImageUrl || null,
          lastLoginAt: null,
        });
      }

      await this.userModel
        .updateOne(
          { _id: legacyAdmin._id, deletedAt: { $exists: false } },
          { $set: { deletedAt: new Date() } },
        )
        .exec();
    }
  }

  async findAll(query: AdminQueryDto) {
    const filter: FilterQuery<AdminDocument> = {
      type: AdminType.ADMIN,
      deletedAt: { $exists: false },
    };
    if (query.search?.trim()) {
      const search = this.escapeRegex(query.search.trim());
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.adminModel.find(filter).sort({ createdAt: -1 }).exec(),
      this.adminModel.countDocuments(filter).exec(),
    ]);
    return { data, total };
  }

  async create(createDto: CreateAdminDto): Promise<AdminDocument> {
    const email = createDto.email.trim().toLowerCase();
    const [existingAdmin, existingUser] = await Promise.all([
      this.adminModel.findOne({ email }).select('_id').exec(),
      this.userModel
        .findOne({ email, deletedAt: { $exists: false } })
        .select('_id')
        .exec(),
    ]);
    if (existingAdmin || existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const password = await bcrypt.hash(createDto.password, 12);
    return new this.adminModel({
      name: createDto.name.trim(),
      email,
      password,
      type: AdminType.ADMIN,
      phone: null,
      country: null,
      state: null,
      city: null,
      address: null,
      profileImageUrl: null,
    }).save();
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Admin account not found');
    }
    const result = await this.adminModel
      .findOneAndUpdate(
        { _id: id, type: AdminType.ADMIN, deletedAt: { $exists: false } },
        { deletedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!result) throw new NotFoundException('Admin account not found');
  }

  async findSelf(id: string): Promise<AdminDocument> {
    const admin = await this.adminModel
      .findOne({
        _id: id,
        type: { $in: [AdminType.ADMIN, AdminType.SUPERADMIN] },
        deletedAt: { $exists: false },
      })
      .exec();
    if (!admin) throw new NotFoundException('Admin account not found');
    return admin;
  }

  async updateSelf(
    id: string,
    updateDto: UpdateAdminProfileDto,
  ): Promise<AdminDocument> {
    const update = Object.fromEntries(
      Object.entries(updateDto).filter(([, value]) => value !== undefined),
    );
    const admin = await this.adminModel
      .findOneAndUpdate(
        {
          _id: id,
          type: { $in: [AdminType.ADMIN, AdminType.SUPERADMIN] },
          deletedAt: { $exists: false },
        },
        update,
        { new: true, runValidators: true },
      )
      .exec();
    if (!admin) throw new NotFoundException('Admin account not found');
    return admin;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}