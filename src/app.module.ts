import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { BookingsModule } from './bookings/bookings.module';
import { UsersModule } from './users/users.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AvailabilitiesModule } from './availabilities/availabilities.module';
import { PhotoGalleriesModule } from './photo-galleries/photo-galleries.module';
import { CommonModule } from './common/common.module';
import { PartnerCompaniesModule } from './partner-companies/partner-companies.module';
import { AdminsModule } from './admins/admins.module';
import {PhotographersModule} from './photographers/photographers.module'
@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '10d' },
      }),
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
    BookingsModule,
    UsersModule,
    ReviewsModule,
    AvailabilitiesModule,
    PhotoGalleriesModule,
    PartnerCompaniesModule,
    AdminsModule,
    CommonModule,
    PhotographersModule
  ],
})
export class AppModule {}