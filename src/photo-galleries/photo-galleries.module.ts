import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotoGalleriesController } from './photo-galleries.controller';
import { PhotoGalleriesService } from './photo-galleries.service';
import { PhotoGallery, PhotoGallerySchema } from '../schemas/photo-gallery.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PhotoGallery.name, schema: PhotoGallerySchema },
    ]),
  ],
  controllers: [PhotoGalleriesController],
  providers: [PhotoGalleriesService],
  exports: [PhotoGalleriesService],
})
export class PhotoGalleriesModule {}