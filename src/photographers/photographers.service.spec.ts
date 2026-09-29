import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PhotographersService } from './photographers.service';
import { User } from '../schemas/user.schema';
import { CreatePhotographerDto } from './dto/photographer.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PhotographersService', () => {
  let service: PhotographersService;
  let model: any;

  const mockPhotographer = {
    _id: '507f1f77bcf86cd799439011',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St, City, State',
    specialties: ['Wedding', 'Portrait'],
    bio: 'Professional photographer',
    experienceYears: 10,
    pricePerHour: 200,
    portfolioUrl: 'https://portfolio.example.com',
    profileImageUrl: 'https://profile.example.com/image.jpg',
    isAvailable: true,
    rating: 4.5,
    totalReviews: 10,
  };

  const createQueryMock = (result: any) => ({
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  });

  const mockModel = {
    findOne: jest.fn().mockImplementation((query) => {
      if (query.email === 'john.doe@example.com' && query.deletedAt) {
        return createQueryMock(mockPhotographer);
      }
      if (query._id === '507f1f77bcf86cd799439011' && query.deletedAt) {
        return createQueryMock(mockPhotographer);
      }
      return createQueryMock(null);
    }),
    findById: jest.fn().mockImplementation((id) => createQueryMock(id === '507f1f77bcf86cd799439011' ? mockPhotographer : null)),
    findByIdAndUpdate: jest.fn().mockImplementation((id, update, options) => createQueryMock({ ...mockPhotographer, ...update })),
    findByIdAndDelete: jest.fn().mockImplementation((id) => createQueryMock(id === '507f1f77bcf86cd799439011' ? mockPhotographer : null)),
    findOneAndUpdate: jest.fn().mockImplementation((query, update, options) => {
      if (query._id === '507f1f77bcf86cd799439011' && query.deletedAt) {
        return createQueryMock({ ...mockPhotographer, ...update });
      }
      return createQueryMock(null);
    }),
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([
        { specialties: ['Wedding', 'Portrait'] },
        { specialties: ['Wedding', 'Event'] },
        { specialties: ['Portrait'] },
      ]),
    }),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
    countDocuments: jest.fn().mockImplementation((query) => {
      if (query?.isAvailable && query?.deletedAt) {
        return createQueryMock(80);
      }
      if (query?.deletedAt) {
        return createQueryMock(100);
      }
      return createQueryMock(100);
    }),
    aggregate: jest.fn().mockImplementation((pipeline) => {
      // Check if pipeline has a $match stage with deletedAt and a $group stage with avgRating or avgPrice
      const hasDeletedAtMatch = pipeline.some((stage: any) => stage.$match?.deletedAt?.$exists === false);
      const hasAvgRating = pipeline.some((stage: any) => stage.$group?.avgRating);
      const hasAvgPrice = pipeline.some((stage: any) => stage.$group?.avgPrice);
      
      if (hasDeletedAtMatch && hasAvgRating) {
        return createQueryMock([{ avgRating: 4.5 }]);
      }
      if (hasDeletedAtMatch && hasAvgPrice) {
        return createQueryMock([{ avgPrice: 200 }]);
      }
      return createQueryMock([]);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotographersService,
        {
          provide: getModelToken(User.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<PhotographersService>(PhotographersService);
    model = module.get(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a photographer by id', async () => {
      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockPhotographer);
    });

    it('should throw NotFoundException if not found', async () => {
      await expect(service.findOne('507f1f77bcf86cd799439012')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid id', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByEmail', () => {
    it('should return a photographer by email', async () => {
      const result = await service.findByEmail('john.doe@example.com');
      expect(result).toEqual(mockPhotographer);
      expect(model.findOne).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        type: 'PHOTOGRAPHER',
        deletedAt: { $exists: false },
      });
    });

    it('should return null if not found', async () => {
      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('getSpecialties', () => {
    it('should return unique specialties', async () => {
      const result = await service.getSpecialties();
      expect(result).toEqual(['Event', 'Portrait', 'Wedding']);
    });
  });

  describe('getStats', () => {
    it('should return photographer statistics', async () => {
      const result = await service.getStats();
      expect(result).toEqual({
        total: 100,
        available: 80,
        averageRating: 4.5,
        averagePrice: 200,
      });
    });
  });
});