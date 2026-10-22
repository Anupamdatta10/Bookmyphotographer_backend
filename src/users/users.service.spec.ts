import { UsersService } from './users.service';
import { UserRole, UserStatus } from '../schemas/user.schema';

describe('UsersService registration flow', () => {
  let service: UsersService;
  let userModel: any;
  let adminModel: any;
  let registrationOtpModel: any;
  let fileUploadService: any;

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
    fileUploadService = { uploadFile: jest.fn() };
    service = new UsersService(userModel, adminModel, registrationOtpModel, fileUploadService, {} as any);
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
});