import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from '../schemas/admin.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { AdminSelfGuard, SuperAdminGuard } from './admin-auth.guard';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AdminsController],
  providers: [AdminsService, SuperAdminGuard, AdminSelfGuard],
})
export class AdminsModule {}