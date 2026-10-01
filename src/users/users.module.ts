import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from '../schemas/user.schema';
import { RegistrationOtp, RegistrationOtpSchema } from '../schemas/registration-otp.schema';
import { CommonModule } from '../common/common.module';
import { Admin, AdminSchema } from '../schemas/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RegistrationOtp.name, schema: RegistrationOtpSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    CommonModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}