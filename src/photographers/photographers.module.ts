import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotographersController } from './photographers.controller';
import { PhotographersService } from './photographers.service';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PhotographersController],
  providers: [PhotographersService],
  exports: [PhotographersService],
})
export class PhotographersModule {}