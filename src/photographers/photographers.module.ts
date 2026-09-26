import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotographersController } from './photographers.controller';
import { PhotographersService } from './photographers.service';
import { Photographer, PhotographerSchema } from '../schemas/photographer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Photographer.name, schema: PhotographerSchema },
    ]),
  ],
  controllers: [PhotographersController],
  providers: [PhotographersService],
  exports: [PhotographersService],
})
export class PhotographersModule {}