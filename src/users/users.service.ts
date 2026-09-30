import { Injectable, NotFoundException, BadRequestException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import * as nodemailer from 'nodemailer';
import { User, UserDocument, UserRole, UserStatus } from '../schemas/user.schema';
import { RegistrationOtp, RegistrationOtpDocument } from '../schemas/registration-otp.schema';
import { CreateUserDto, CreateUserFirstDto, CreateUserSecondDto, UpdateUserDto, UpdateOccupiedDatesDto, UserQueryDto, LoginDto } from './dto/user.dto';
import { FileUploadService } from '../common/services/file-upload.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RegistrationOtp.name) private registrationOtpModel: Model<RegistrationOtpDocument>,
    private fileUploadService: FileUploadService,
    private configService: ConfigService,
  ) { }

  async sendRegistrationOtp(createUserFirstDto: CreateUserFirstDto): Promise<{ message: string }> {
    const email = createUserFirstDto.email.toLowerCase();
    const existingUser = await this.userModel.findOne({ email, deletedAt: { $exists: false } }).exec();
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const passwordHash = await bcrypt.hash(createUserFirstDto.password, 12);
    await this.registrationOtpModel.findOneAndUpdate(
      { email },
      { otp, name: createUserFirstDto.name, passwordHash, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    try {
      const user = this.configService.get<string>('EMAIL');
      const pass = this.configService.get<string>('EMAIL_PASSWORD');
      if (!user || !pass) {
        throw new Error('Email settings are missing');
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
      const result = await transporter.sendMail({
        from: user,
        to: email,
        subject: 'Your verification code for BookMyPhotographer',
        text: `Your verification code is ${otp}. It expires in 10 minutes.`,
      });
      console.info('Registration OTP email sent:', {
        recipient: email,
        messageId: result.messageId,
      });
    } catch (error) {
      const mailError = error as Error & {
        code?: string;
        command?: string;
        responseCode?: number;
        response?: string;
      };
      console.error('Registration OTP email failed:', {
        recipient: email,
        message: mailError.message || String(error),
        code: mailError.code,
        command: mailError.command,
        responseCode: mailError.responseCode,
        response: mailError.response,
      });
      await this.registrationOtpModel.deleteOne({ email, otp }).exec();
      throw new ServiceUnavailableException('Unable to send verification email. Check SMTP configuration.');
    }

    return { message: 'Request received. Verification email sent.' };
  }

  async verifyRegistrationOtp(email: string, otp: string): Promise<{ message: string }> {
    const record = await this.registrationOtpModel.findOne({
      email: email.toLowerCase(),
      otp,
      expiresAt: { $gt: new Date() },
    }).select('+passwordHash').exec();

    if (!record) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const user = new this.userModel({
      name: record.name,
      email: record.email,
      password: record.passwordHash,
    });
    await user.save();
    await this.registrationOtpModel.deleteOne({ _id: record._id }).exec();
    return { message: 'Email verified successfully' };
  }

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  async createSecondStep(createUserSecondDto: CreateUserSecondDto, file?: Express.Multer.File) {
    const email = createUserSecondDto.email.toLowerCase();
    const existingUser = await this.userModel.findOne({ email, deletedAt: { $exists: false } }).exec();
    if (!existingUser) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    const profileImageUrl = file
      ? await this.fileUploadService.uploadFile(file, 'profiles')
      : null;
    const hasCoordinates = createUserSecondDto.latitude !== undefined && createUserSecondDto.longitude !== undefined;
    const updateData = {
      ...(createUserSecondDto.type ? { type: createUserSecondDto.type } : {}),
      phone: createUserSecondDto.phone ?? null,
      city: createUserSecondDto.city ?? null,
      country: createUserSecondDto.country ?? null,
      state: createUserSecondDto.state ?? null,
      address1: createUserSecondDto.address1 ?? null,
      address2: createUserSecondDto.address2 ?? null,
      location: hasCoordinates
        ? {
            type: 'Point' as const,
            coordinates: [createUserSecondDto.longitude!, createUserSecondDto.latitude!] as [number, number],
          }
        : null,
      profileImageUrl,
    };

    const updatedUser = await this.userModel
      .findOneAndUpdate({ email, deletedAt: { $exists: false } }, { $set: updateData }, { new: true, runValidators: true })
      .select('-password')
      .exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return {
      message: 'User profile updated successfully',
      update_sts:true,
      data: updatedUser,
    };
  }

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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const updateData: Record<string, unknown> = Object.fromEntries(
      Object.entries(updateUserDto).filter(
        ([key, value]) => key !== 'profileImageUrl' && value !== undefined,
      ),
    );

    if (typeof updateData.email === 'string') {
      updateData.email = updateData.email.toLowerCase();
      const existingUser = await this.userModel.findOne({
        email: updateData.email,
        _id: { $ne: id },
        deletedAt: { $exists: false },
      }).exec();
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (typeof updateData.password === 'string' && updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No user details provided');
    }

    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $exists: false } },
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async updateProfilePicture(id: string, file?: Express.Multer.File): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!file) {
      throw new BadRequestException('Profile picture file is required');
    }

    const user = await this.userModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const profileImageUrl = await this.fileUploadService.uploadFile(file, 'profiles');
    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $exists: false } },
        { $set: { profileImageUrl } },
        { new: true, runValidators: true },
      )
      .select('-password')
      .exec();

    if (!updatedUser) {
      await this.fileUploadService.deleteFile(profileImageUrl);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (user.profileImageUrl) {
      await this.fileUploadService.deleteFile(user.profileImageUrl);
    }

    return updatedUser;
  }

  async updateOccupiedDates(id: string, updateDto: UpdateOccupiedDatesDto): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const occupiedDates = updateDto.occupiedDates.map((date) => new Date(date));
    const updatedUser = await this.userModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $exists: false } },
        { $set: { occupiedDates } },
        { new: true, runValidators: true },
      )
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  async updatePhotographerStatus(id: string, status: UserStatus): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid photographer ID');
    }

    const updatedPhotographer = await this.userModel
      .findOneAndUpdate(
        { _id: id, type: UserRole.PHOTOGRAPHER, deletedAt: { $exists: false } },
        { $set: { status } },
        { new: true, runValidators: true },
      )
      .select('-password')
      .exec();

    if (!updatedPhotographer) {
      throw new NotFoundException(`Photographer with ID ${id} not found`);
    }

    return updatedPhotographer;
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