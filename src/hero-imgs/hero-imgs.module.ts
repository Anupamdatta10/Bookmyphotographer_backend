import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HeroImg, HeroImgSchema } from '../schemas/hero-img.schema';
import { HeroImgsService } from './hero-imgs.service';
import { HeroImgsController } from './hero-imgs.controller';
import { CommonModule } from '../common/common.module';
import { Admin, AdminSchema } from '../schemas/admin.schema';
import { AdminsModule } from '../admins/admins.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HeroImg.name, schema: HeroImgSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    CommonModule,
    AdminsModule,
  ],
  controllers: [HeroImgsController],
  providers: [HeroImgsService],
  exports: [HeroImgsService],
})
export class HeroImgsModule {}