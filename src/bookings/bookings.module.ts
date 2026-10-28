import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking, BookingSchema } from '../schemas/booking.schema';
import { Admin, AdminSchema } from '../schemas/admin.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { AdminsModule } from '../admins/admins.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AdminsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}