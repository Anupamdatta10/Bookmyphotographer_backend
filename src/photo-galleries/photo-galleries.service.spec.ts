import { BadRequestException } from '@nestjs/common';
import { PhotoGalleriesService } from './photo-galleries.service';
import { UserRole } from '../schemas/user.schema';

describe('PhotoGalleriesService', () => {
  let service: PhotoGalleriesService;
  let photoGalleryModel: any;
  let userModel: any;
  let fileUploadService: any;

  beforeEach(() => {
    photoGalleryModel = jest.fn();
    photoGalleryModel.countDocuments = jest.fn();
    photoGalleryModel.updateMany = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    });
    userModel = { findById: jest.fn() };
    fileUploadService = { uploadFile: jest.fn() };
    service = new PhotoGalleriesService(
      photoGalleryModel,
      userModel,
      fileUploadService,
    );
  });

  it('rejects adding a sixth portfolio photo for a photographer', async () => {
    const userId = '65a000000000000000000001';
    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ type: UserRole.PHOTOGRAPHER }),
    });
    photoGalleryModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(5),
    });

    await expect(service.create({ userId }, undefined)).rejects.toThrow(
      new BadRequestException(
        'Photographers can upload up to 5 portfolio photos.',
      ),
    );
    expect(photoGalleryModel).not.toHaveBeenCalled();
  });

  it('does not count profile images toward the portfolio photo limit', async () => {
    const userId = '65a000000000000000000001';
    photoGalleryModel.mockImplementation((photo: Record<string, unknown>) => ({
      ...photo,
      save: jest.fn().mockResolvedValue(photo),
    }));

    const result = await service.create(
      { userId, isProfileImage: true },
      undefined,
    );

    expect(result.isProfileImage).toBe(true);
    expect(userModel.findById).not.toHaveBeenCalled();
    expect(photoGalleryModel.countDocuments).not.toHaveBeenCalled();
  });
});
