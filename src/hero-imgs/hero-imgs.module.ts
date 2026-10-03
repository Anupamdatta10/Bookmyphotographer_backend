import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HeroImg, HeroImgSchema } from '../schemas/hero-img.schema';
import { HeroImgsService } from './hero-imgs.service';
import { HeroImgsController } from './hero-imgs.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HeroImg.name, schema: HeroImgSchema }]),
    CommonModule,
  ],
  controllers: [HeroImgsController],
  providers: [HeroImgsService],
  exports: [HeroImgsService],
})
export class HeroImgsModule {}