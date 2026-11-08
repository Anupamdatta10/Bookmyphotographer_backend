import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from '../schemas/user.schema';
import { RegistrationOtp, RegistrationOtpSchema } from '../schemas/registration-otp.schema';
import { CommonModule } from '../common/common.module';
import { Admin, AdminSchema } from '../schemas/admin.schema';
import { ProfileVideo, ProfileVideoSchema } from '../schemas/profile-video.schema';
import { PasswordResetOtp, PasswordResetOtpSchema } from '../schemas/password-reset-otp.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RegistrationOtp.name, schema: RegistrationOtpSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: ProfileVideo.name, schema: ProfileVideoSchema },
      { name: PasswordResetOtp.name, schema: PasswordResetOtpSchema },
    ]),
    CommonModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}