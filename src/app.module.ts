import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PhotographersModule } from './photographers/photographers.module';
import { BookingsModule } from './bookings/bookings.module';
import { UsersModule } from './users/users.module';
import { TagsModule } from './tags/tags.module';
import { TagUserRelationsModule } from './tag-user-relations/tag-user-relations.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AvailabilitiesModule } from './availabilities/availabilities.module';
import { PhotoGalleriesModule } from './photo-galleries/photo-galleries.module';
import { SocialMediaLinksModule } from './social-media-links/social-media-links.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/book-my-photographer',
        // Connection options
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    PhotographersModule,
    BookingsModule,
    UsersModule,
    TagsModule,
    TagUserRelationsModule,
    ReviewsModule,
    AvailabilitiesModule,
    PhotoGalleriesModule,
    SocialMediaLinksModule,
  ],
})
export class AppModule {}