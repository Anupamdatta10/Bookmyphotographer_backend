import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotoGalleriesController } from './photo-galleries.controller';
import { PhotoGalleriesService } from './photo-galleries.service';
import { PhotoGallery, PhotoGallerySchema } from '../schemas/photo-gallery.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Admin, AdminSchema } from '../schemas/admin.schema';
import { CommonModule } from '../common/common.module';
import { AdminsModule } from '../admins/admins.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PhotoGallery.name, schema: PhotoGallerySchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    CommonModule,
    AdminsModule,
  ],
  controllers: [PhotoGalleriesController],
  providers: [PhotoGalleriesService],
  exports: [PhotoGalleriesService],
})
export class PhotoGalleriesModule {}