import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../schemas/booking.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateBookingDto, UpdateBookingDto, BookingQueryDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<BookingDocument> {
    // Validate photographer and user IDs
    if (!Types.ObjectId.isValid(createBookingDto.photographerId)) {
      throw new BadRequestException('Invalid photographer ID');
    }
    if (!Types.ObjectId.isValid(createBookingDto.userId)) {
      throw new BadRequestException('Invalid user ID');
    }

      // Check for conflicting bookings (same photographer, same date/time) for each event date
      const durationHours = createBookingDto.durationHours || 1;
    
      const photographer = await this.userModel.findOne({
        _id: createBookingDto.photographerId,
        deletedAt: { $exists: false },
      }).select('occupiedDates').lean().exec();

      for (const eventDate of createBookingDto.eventDate) {
        const date = new Date(eventDate);
        const endDate = new Date(date.getTime() + durationHours * 60 * 60 * 1000);
        const dateKey = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).getTime();
        const isOccupied = (photographer?.occupiedDates || []).some((occupiedDate) => {
          const occupied = new Date(occupiedDate);
          return new Date(Date.UTC(occupied.getUTCFullYear(), occupied.getUTCMonth(), occupied.getUTCDate())).getTime() === dateKey;
        });
        if (isOccupied) {
          throw new ConflictException(`Photographer is not available on ${date.toISOString()}`);
        }

        const conflictingBooking = await this.bookingModel.findOne({
          photographerId: createBookingDto.photographerId,
          status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
          deletedAt: { $exists: false },
          $or: [
            { eventDate: { $elemMatch: { $lt: endDate, $gte: date } } },
            {
              $expr: {
                $lt: [
                  {
                    $add: [
                      { $arrayElemAt: ['$eventDate', 0] },
                      { $multiply: ['$durationHours', 3600000] },
                    ],
                  },
                  endDate,
                ],
              },
            },
          ],
        }).exec();

        if (conflictingBooking) {
          throw new ConflictException(`Photographer is not available at the requested time on ${date.toISOString()}`);
        }
      }

      const createdBooking = new this.bookingModel({
        ...createBookingDto,
        photographerId: new Types.ObjectId(createBookingDto.photographerId),
        userId: new Types.ObjectId(createBookingDto.userId),
      });

      return createdBooking.save();
    }

  async findAll(queryDto: BookingQueryDto): Promise<{ data: BookingDocument[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 10,
      photographerId,
      userId,
      status,
      search,
      startDate,
      endDate,
      sortBy = 'eventDate',
      sortOrder = 'asc',
    } = queryDto;

    // Build filter query
    const filter: FilterQuery<BookingDocument> = {};

    if (photographerId) {
      if (!Types.ObjectId.isValid(photographerId)) {
        throw new BadRequestException('Invalid photographer ID');
      }
      filter.photographerId = new Types.ObjectId(photographerId);
    }

    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      filter.userId = new Types.ObjectId(userId);
    }

    if (status) {
      filter.status = status;
    }

    const searchText = search?.trim();
    if (searchText) {
      const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchPattern = new RegExp(escapedSearch, 'i');
      const matchingUsers = await this.userModel
        .find({ $or: [{ name: searchPattern }, { email: searchPattern }] }, '_id')
        .lean()
        .exec();
      const searchConditions: FilterQuery<BookingDocument>[] = [
        { eventLocation: searchPattern },
        { photographerId: { $in: matchingUsers.map((user) => user._id) } },
        { userId: { $in: matchingUsers.map((user) => user._id) } },
      ];
      if (Types.ObjectId.isValid(searchText)) {
        searchConditions.push({ _id: new Types.ObjectId(searchText) });
      }
      filter.$or = searchConditions;
    }

    if (startDate || endDate) {
          filter.eventDate = { $elemMatch: {} };
          if (startDate) filter.eventDate.$elemMatch.$gte = startDate;
          if (endDate) filter.eventDate.$elemMatch.$lte = endDate;
    }

    // Exclude soft deleted
    filter.deletedAt = { $exists: false };

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [data, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .populate('photographerId', 'name email phone profileImageUrl')
        .populate('userId', 'name email phone')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.bookingModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid booking ID');
    }

    const booking = await this.bookingModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('photographerId', 'name email phone profileImageUrl specialties pricePerHour')
      .populate('userId', 'name email phone')
      .exec();

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async findByPhotographer(photographerId: string, queryDto: BookingQueryDto) {
    if (!Types.ObjectId.isValid(photographerId)) {
      throw new BadRequestException('Invalid photographer ID');
    }
    return this.findAll({ ...queryDto, photographerId });
  }

  async findByUser(userId: string, queryDto: BookingQueryDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.findAll({ ...queryDto, userId });
  }

  async update(id: string, updateBookingDto: UpdateBookingDto): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid booking ID');
    }

    const updateData: Record<string, unknown> = { ...updateBookingDto };

    // If photographerId is being updated, validate it
    if (updateBookingDto.photographerId) {
      if (!Types.ObjectId.isValid(updateBookingDto.photographerId)) {
        throw new BadRequestException('Invalid photographer ID');
      }
      updateData.photographerId = new Types.ObjectId(updateBookingDto.photographerId);
    }

    // Check for conflicts if eventDate or photographerId is being updated
    if (updateBookingDto.eventDate || updateBookingDto.photographerId) {
      const booking = await this.bookingModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();
      if (!booking) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }

      const photographerId = updateBookingDto.photographerId || booking.photographerId.toString();
          const eventDates = updateBookingDto.eventDate ? updateBookingDto.eventDate.map(d => new Date(d)) : booking.eventDate;
      const durationHours = updateBookingDto.durationHours || booking.durationHours;

          // Check each event date for conflicts
          for (const eventDate of eventDates) {
            const endDate = new Date(eventDate.getTime() + durationHours * 60 * 60 * 1000);

            const conflictingBooking = await this.bookingModel.findOne({
              _id: { $ne: id },
              photographerId: new Types.ObjectId(photographerId),
              status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS] },
              deletedAt: { $exists: false },
              $or: [
                { eventDate: { $elemMatch: { $lt: endDate, $gte: eventDate } } },
                {
                  $expr: {
                    $lt: [
                      {
                        $add: [
                          { $arrayElemAt: ['$eventDate', 0] },
                          { $multiply: ['$durationHours', 3600000] },
                        ],
                      },
                      endDate,
                    ],
                  },
                },
              ],
            }).exec();

            if (conflictingBooking) {
              throw new ConflictException(`Photographer is not available at the requested time on ${eventDate.toISOString()}`);
            }
          }
        }

    const updatedBooking = await this.bookingModel
      .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, updateData, { new: true, runValidators: true })
      .populate('photographerId', 'name email phone profileImageUrl')
      .populate('userId', 'name email phone')
      .exec();

    if (!updatedBooking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return updatedBooking;
  }

  async updateStatus(id: string, status: BookingStatus): Promise<BookingDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid booking ID');
    }
    if (![BookingStatus.CONFIRMED, BookingStatus.REJECTED, BookingStatus.CANCELLED, BookingStatus.COMPLETED].includes(status)) {
      throw new BadRequestException('Status can only be confirmed, rejected, cancelled, or completed');
    }

    const booking = await this.bookingModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .exec();
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    const currentStatus = booking.status;
    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.REJECTED, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.REJECTED]: [],
    };
    if (!allowedTransitions[currentStatus]?.includes(status)) {
      throw new BadRequestException(`Booking status cannot change from ${currentStatus} to ${status}`);
    }

    const updateData: Partial<Booking> = { status };
    if (status === BookingStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }
    if (status === BookingStatus.CONFIRMED) {
      updateData.confirmedAt = new Date();
      const occupiedDates = [...new Set(booking.eventDate.map((date) => {
        const eventDate = new Date(date);
        return new Date(Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate())).toISOString();
      }))].map((date) => new Date(date));

      await this.userModel.findOneAndUpdate(
        { _id: booking.photographerId, deletedAt: { $exists: false } },
        { $addToSet: { occupiedDates: { $each: occupiedDates } } },
        { new: true },
      ).exec();
    }

    const updatedBooking = await this.bookingModel
      .findOneAndUpdate(
        { _id: id, deletedAt: { $exists: false } },
        updateData,
        { new: true, runValidators: true },
      )
      .populate('photographerId', 'name email phone profileImageUrl occupiedDates')
      .populate('userId', 'name email phone')
      .exec();

    if (!updatedBooking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return updatedBooking;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid booking ID');
    }

    // Soft delete
    const result = await this.bookingModel.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
      { new: true }
    ).exec();

    if (!result) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
  }

  async getStats(photographerId?: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    rejected: number;
    totalRevenue: number;
  }> {
    const filter: FilterQuery<BookingDocument> = { deletedAt: { $exists: false } };
    if (photographerId) {
      if (!Types.ObjectId.isValid(photographerId)) {
        throw new BadRequestException('Invalid photographer ID');
      }
      filter.photographerId = new Types.ObjectId(photographerId);
    }

    const [total, pending, confirmed, inProgress, completed, cancelled, rejected, revenueStats] = await Promise.all([
      this.bookingModel.countDocuments(filter).exec(),
      this.bookingModel.countDocuments({ ...filter, status: BookingStatus.PENDING }).exec(),
      this.bookingModel.countDocuments({ ...filter, status: BookingStatus.CONFIRMED }).exec(),
      this.bookingModel.countDocuments({ ...filter, status: BookingStatus.IN_PROGRESS }).exec(),
      this.bookingModel.countDocuments({ ...filter, status: BookingStatus.COMPLETED }).exec(),
      this.bookingModel.countDocuments({ ...filter, status: BookingStatus.CANCELLED }).exec(),
      this.bookingModel.countDocuments({ ...filter, status: BookingStatus.REJECTED }).exec(),
      this.bookingModel.aggregate([
        { $match: { ...filter, status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' } } },
      ]).exec(),
    ]);

    return {
      total,
      pending,
      confirmed,
      inProgress,
      completed,
      cancelled,
      rejected,
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
    };
  }

  async getUpcomingBookings(photographerId: string, limit: number = 10): Promise<BookingDocument[]> {
    if (!Types.ObjectId.isValid(photographerId)) {
      throw new BadRequestException('Invalid photographer ID');
    }

    return this.bookingModel
      .find({
        photographerId: new Types.ObjectId(photographerId),
          eventDate: { $elemMatch: { $gte: new Date() } },
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        deletedAt: { $exists: false },
      })
      .populate('userId', 'name email phone')
      .sort({ eventDate: 1 })
      .limit(limit)
      .exec();
  }
}