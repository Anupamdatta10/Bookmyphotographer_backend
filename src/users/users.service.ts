import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { CreateUserDto, UpdateUserDto, UserQueryDto, LoginDto } from './dto/user.dto';
import { FileUploadService } from '@/common/services/file-upload.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private fileUploadService: FileUploadService,
  ) {}

  async create(createUserDto: CreateUserDto, file?: Express.Multer.File): Promise<UserDocument> {
    // Check if email already exists
    const existingUser = await this.userModel.findOne({ email: createUserDto.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Upload profile image if provided
    let profileImageUrl = '';
    if (file) {
      profileImageUrl = await this.fileUploadService.uploadFile(file, 'profiles');
    }

    const createdUser = new this.userModel({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
      profileImageUrl,
    });

    return createdUser.save();
  }

  async findAll(queryDto: UserQueryDto): Promise<{ data: UserDocument[]; total: number; page: number; limit: number }> {
    const {
      page = '1',
      limit = '10',
      type,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Build filter query
    const filter: FilterQuery<UserDocument> = {};

    if (type) {
      filter.type = type;
    }

    if (isActive !== undefined) {
      filter.isActive = String(isActive) === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
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
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async findOne(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findOne({ _id: id, deletedAt: { $exists: false } }).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase(), deletedAt: { $exists: false } }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase(), deletedAt: { $exists: false } }).select('+password').exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto, file?: Express.Multer.File): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    // Check if email is being updated and if it already exists
    if (updateUserDto.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email.toLowerCase(),
        _id: { $ne: id },
        deletedAt: { $exists: false },
      });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Hash password if being updated
    const updateData: Record<string, unknown> = { ...updateUserDto };
    if (updateUserDto.password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    if (updateUserDto.email) {
      updateData.email = updateUserDto.email.toLowerCase();
    }

    // Upload new profile image if provided
    if (file) {
      // Delete old profile image if exists
      const oldUser = await this.userModel.findById(id).exec();
      if (oldUser?.profileImageUrl) {
        await this.fileUploadService.deleteFile(oldUser.profileImageUrl);
      }
      updateData.profileImageUrl = await this.fileUploadService.uploadFile(file, 'profiles');
    }

    const updatedUser = await this.userModel
      .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, updateData, { new: true, runValidators: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    // Delete associated profile image
    const user = await this.userModel.findById(id).exec();
    if (user?.profileImageUrl) {
      await this.fileUploadService.deleteFile(user.profileImageUrl);
    }

    // Soft delete
    const result = await this.userModel.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
      { new: true }
    ).exec();

    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async validateUser(loginDto: LoginDto): Promise<UserDocument | null> {
    const user = await this.findByEmailWithPassword(loginDto.email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Update last login
    await this.userModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();

    return user;
  }

  async getStats(): Promise<{
    total: number;
    admins: number;
    photographers: number;
    partners: number;
    superadmins: number;
    active: number;
    inactive: number;
  }> {
    const [total, admins, photographers, partners, superadmins, active, inactive] = await Promise.all([
      this.userModel.countDocuments({ deletedAt: { $exists: false } }).exec(),
      this.userModel.countDocuments({ type: UserRole.ADMIN, deletedAt: { $exists: false } }).exec(),
      this.userModel.countDocuments({ type: UserRole.PHOTOGRAPHER, deletedAt: { $exists: false } }).exec(),
      this.userModel.countDocuments({ type: UserRole.PARTNER, deletedAt: { $exists: false } }).exec(),
      this.userModel.countDocuments({ type: UserRole.SUPERADMIN, deletedAt: { $exists: false } }).exec(),
      this.userModel.countDocuments({ isActive: true, deletedAt: { $exists: false } }).exec(),
      this.userModel.countDocuments({ isActive: false, deletedAt: { $exists: false } }).exec(),
    ]);

    return {
      total,
      admins,
      photographers,
      partners,
      superadmins,
      active,
      inactive,
    };
  }
}