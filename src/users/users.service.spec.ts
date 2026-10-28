import { UsersService } from './users.service';
import { UserRole, UserStatus } from '../schemas/user.schema';

describe('UsersService registration flow', () => {
  let service: UsersService;
  let userModel: any;
  let adminModel: any;
  let registrationOtpModel: any;
  let fileUploadService: any;
  let profileVideoModel: any;

  beforeEach(() => {
    userModel = jest.fn().mockImplementation((user) => ({
      ...user,
      save: jest.fn().mockResolvedValue(user),
    }));
    userModel.findOne = jest.fn();
    userModel.findOneAndUpdate = jest.fn();
    adminModel = { findOne: jest.fn(), findByIdAndUpdate: jest.fn() };

    registrationOtpModel = {
      findOne: jest.fn(),
      deleteOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) }),
    };
    fileUploadService = {
      uploadFile: jest.fn(),
      uploadVideoFile: jest.fn(),
      deleteFile: jest.fn(),
    };
    profileVideoModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findOneAndDelete: jest.fn(),
      find: jest.fn(),
      deleteMany: jest.fn(),
    };
    service = new UsersService(
      userModel,
      adminModel,
      registrationOtpModel,
      fileUploadService,
      profileVideoModel,
      {} as any,
    );
  });

  it('creates a user from verified pending registration details', async () => {
    const record = {
      _id: 'otp-id',
      email: 'person@example.com',
      name: 'Person Name',
      passwordHash: 'hashed-password',
    };
    const query = {
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(record),
    };
    registrationOtpModel.findOne.mockReturnValue(query);

    await expect(service.verifyRegistrationOtp('PERSON@example.com', '123456')).resolves.toEqual({
      message: 'Email verified successfully',
      data: {
        email: 'person@example.com',
        name: 'Person Name',
        type: undefined,
      },
    });

    expect(query.select).toHaveBeenCalledWith('+passwordHash');
    expect(userModel).toHaveBeenCalledWith({
      name: 'Person Name',
      email: 'person@example.com',
      password: 'hashed-password',
    });
    expect(registrationOtpModel.deleteOne).toHaveBeenCalledWith({ _id: 'otp-id' });
  });

  it('saves submitted profile fields and null for omitted values', async () => {
    const updatedUser = { email: 'person@example.com' };
    const updateQuery = {
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(updatedUser),
    };
    userModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'user-id' }) });
    userModel.findOneAndUpdate.mockReturnValue(updateQuery);

    const result = await service.createSecondStep({
      email: 'PERSON@example.com',
      type: UserRole.PHOTOGRAPHER,
      latitude: 37.7749,
      longitude: -122.4194,
      phone: '+1234567890',
    }, undefined);

    expect(result.data).toBe(updatedUser);
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { email: 'person@example.com', deletedAt: { $exists: false } },
      {
        $set: {
          type: UserRole.PHOTOGRAPHER,
          phone: '+1234567890',
          city: null,
          country: null,
          district: null,
          state: null,
          address1: null,
          address2: null,
          location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
          profileImageUrl: null,
        },
      },
      { new: true, runValidators: true },
    );
    expect(updateQuery.select).toHaveBeenCalledWith('-password');
  });

  it('calculates and stores age when a date of birth is updated', async () => {
    const userId = '65a000000000000000000003';
    const today = new Date();
    const expectedAge =
      today.getUTCFullYear() -
      2000 -
      (today.getUTCMonth() < 11 ||
      (today.getUTCMonth() === 11 && today.getUTCDate() < 31)
        ? 1
        : 0);
    const updatedUser = {
      _id: userId,
      dob: new Date('2000-12-31'),
      age: expectedAge,
    };
    const updateQuery = {
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(updatedUser),
    };
    userModel.findOneAndUpdate.mockReturnValue(updateQuery);

    await service.update(userId, { dob: '2000-12-31' });

    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId, deletedAt: { $exists: false } },
      {
        $set: {
          dob: new Date('2000-12-31'),
          age: expectedAge,
        },
      },
      { new: true, runValidators: true },
    );
  });

  it('clears the stored age when the date of birth is removed', async () => {
    const userId = '65a000000000000000000004';
    const updateQuery = {
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: userId, dob: null, age: null }),
    };
    userModel.findOneAndUpdate.mockReturnValue(updateQuery);

    await service.update(userId, { dob: null });

    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId, deletedAt: { $exists: false } },
      { $set: { dob: null, age: null } },
      { new: true, runValidators: true },
    );
  });

  it('rejects a future date of birth', async () => {
    const userId = '65a000000000000000000005';

    await expect(
      service.update(userId, { dob: '2999-01-01' }),
    ).rejects.toThrow('Date of birth cannot be in the future');

    expect(userModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('replaces a user occupied-date list with stored Date values', async () => {
    const userId = '65a000000000000000000001';
    const occupiedDates = ['2026-10-05T00:00:00.000Z'];
    const updatedUser = { _id: userId, occupiedDates };
    const updateQuery = {
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(updatedUser),
    };
    userModel.findOneAndUpdate.mockReturnValue(updateQuery);

    await expect(
      service.updateOccupiedDates(userId, { occupiedDates }),
    ).resolves.toBe(updatedUser);

    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId, deletedAt: { $exists: false } },
      { $set: { occupiedDates: [new Date(occupiedDates[0])] } },
      { new: true, runValidators: true },
    );
    expect(updateQuery.select).toHaveBeenCalledWith('-password');
  });

  it('updates status only for an existing photographer', async () => {
    const userId = '65a000000000000000000002';
    const updatedPhotographer = { _id: userId, status: UserStatus.ACTIVE };
    const updateQuery = {
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(updatedPhotographer),
    };
    userModel.findOneAndUpdate.mockReturnValue(updateQuery);

    await expect(
      service.updatePhotographerStatus(userId, UserStatus.ACTIVE),
    ).resolves.toBe(updatedPhotographer);

    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: userId,
        type: UserRole.PHOTOGRAPHER,
        deletedAt: { $exists: false },
      },
      { $set: { status: UserStatus.ACTIVE } },
      { new: true, runValidators: true },
    );
    expect(updateQuery.select).toHaveBeenCalledWith('-password');
  });

  it('stores a new profile video for a photographer and removes the previous video', async () => {
    const userId = '65a000000000000000000006';
    const uploadedVideoUrl = '/public/uploads/videos/new-video.mp4';
    const user = { _id: userId, type: UserRole.PHOTOGRAPHER };
    const previousVideo = {
      _id: 'video-id',
      userId,
      slot: 1,
      videoName: 'old-video.mp4',
      videoUrl: '/public/uploads/videos/old-video.mp4',
    };
    const savedVideo = {
      _id: 'video-id',
      userId,
      slot: 1,
      videoName: 'new-video.mp4',
      originalName: 'new-video.mp4',
      videoUrl: uploadedVideoUrl,
    };
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    profileVideoModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(previousVideo),
    });
    profileVideoModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(savedVideo),
    });
    fileUploadService.uploadVideoFile.mockResolvedValue(uploadedVideoUrl);

    await expect(
      service.updateProfileVideo(userId, 1, {
        originalname: 'new-video.mp4',
        mimetype: 'video/mp4',
        size: 1024,
      } as Express.Multer.File),
    ).resolves.toBe(savedVideo);

    expect(fileUploadService.uploadVideoFile).toHaveBeenCalled();
    expect(profileVideoModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: user._id, slot: 1 },
      {
        $set: {
          userId: user._id,
          slot: 1,
          videoName: 'new-video.mp4',
          originalName: 'new-video.mp4',
          videoUrl: uploadedVideoUrl,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
    expect(fileUploadService.deleteFile).toHaveBeenCalledWith(
      previousVideo.videoUrl,
    );
  });

  it('rejects profile video slots outside the two available slots', async () => {
    await expect(
      service.updateProfileVideo('65a000000000000000000007', 2, {
        originalname: 'new-video.mp4',
        mimetype: 'video/mp4',
        size: 1024,
      } as Express.Multer.File),
    ).rejects.toThrow('Video slot must be 0 or 1');
  });

  it('loads profile video records in slot order', async () => {
    const userId = '65a000000000000000000008';
    const user = { _id: userId, type: UserRole.PHOTOGRAPHER };
    const videos = [{ slot: 0 }, { slot: 1 }];
    const query = {
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(videos),
    };
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    profileVideoModel.find.mockReturnValue(query);

    await expect(service.findProfileVideos(userId)).resolves.toBe(videos);
    expect(profileVideoModel.find).toHaveBeenCalledWith({ userId: user._id });
    expect(query.sort).toHaveBeenCalledWith({ slot: 1 });
  });

  it('removes a profile video record and its stored file', async () => {
    const userId = '65a000000000000000000009';
    const user = {
      _id: userId,
      type: UserRole.PHOTOGRAPHER,
      profileVideoUrls: ['', '/public/uploads/videos/legacy.mp4'],
      profileVideoUrl: '',
    };
    const video = {
      videoUrl: '/public/uploads/videos/saved-video.mp4',
    };
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    userModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });
    profileVideoModel.findOneAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue(video),
    });

    await expect(service.removeProfileVideo(userId, 1)).resolves.toBeUndefined();

    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: user._id, deletedAt: { $exists: false } },
      {
        $set: {
          profileVideoUrls: ['', ''],
        },
      },
      { new: true, runValidators: true },
    );
    expect(profileVideoModel.findOneAndDelete).toHaveBeenCalledWith({
      userId: user._id,
      slot: 1,
    });
    expect(fileUploadService.deleteFile).toHaveBeenCalledWith(video.videoUrl);
    expect(fileUploadService.deleteFile).toHaveBeenCalledWith(
      '/public/uploads/videos/legacy.mp4',
    );
  });

  it('removes the profile picture and its stored file', async () => {
    const userId = '65a000000000000000000010';
    const user = {
      profileImageUrl: '/public/uploads/profiles/profile-image.jpg',
    };
    userModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue(user),
    });

    await expect(service.removeProfilePicture(userId)).resolves.toBeUndefined();

    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId, deletedAt: { $exists: false } },
      { $set: { profileImageUrl: '' } },
      { new: false, runValidators: true },
    );
    expect(fileUploadService.deleteFile).toHaveBeenCalledWith(
      user.profileImageUrl,
    );
  });
});