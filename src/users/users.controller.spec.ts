jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}));

import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import * as request from 'supertest';
import { ProfileVideo } from '../schemas/profile-video.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController profile videos', () => {
  let app: INestApplication;
  let usersService: {
    findProfileVideos: jest.Mock;
    updateProfileVideo: jest.Mock;
    removeProfileVideo: jest.Mock;
    removeProfilePicture: jest.Mock;
  };

  beforeAll(async () => {
    usersService = {
      findProfileVideos: jest.fn(),
      updateProfileVideo: jest.fn(),
      removeProfileVideo: jest.fn(),
      removeProfilePicture: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves saved video metadata from the photographer videos route', async () => {
    const userId = '65a000000000000000000001';
    const video = {
      userId: new Types.ObjectId(userId),
      slot: 0,
      videoName: 'a-unique-video.mp4',
      originalName: 'my-video.mp4',
      videoUrl: '/public/uploads/videos/a-unique-video.mp4',
    } as ProfileVideo;
    usersService.findProfileVideos.mockResolvedValue([video]);

    await request(app.getHttpServer())
      .get(`/api/users/${userId}/profile-videos`)
      .expect(200)
      .expect([
        {
          userId,
          slot: 0,
          videoName: 'a-unique-video.mp4',
          originalName: 'my-video.mp4',
          videoUrl: '/public/uploads/videos/a-unique-video.mp4',
        },
      ]);
  });

  it('accepts a multipart upload on the slot PATCH route', async () => {
    const userId = '65a000000000000000000001';
    const video = {
      userId: new Types.ObjectId(userId),
      slot: 0,
      videoName: 'a-unique-video.mp4',
      originalName: 'my-video.mp4',
      videoUrl: '/public/uploads/videos/a-unique-video.mp4',
    } as ProfileVideo;
    usersService.updateProfileVideo.mockResolvedValue(video);

    await request(app.getHttpServer())
      .patch(`/api/users/${userId}/profile-videos/0`)
      .attach('file', Buffer.from('video bytes'), {
        filename: 'my-video.mp4',
        contentType: 'video/mp4',
      })
      .expect(200)
      .expect({
        userId,
        slot: 0,
        videoName: 'a-unique-video.mp4',
        originalName: 'my-video.mp4',
        videoUrl: '/public/uploads/videos/a-unique-video.mp4',
      });

    expect(usersService.updateProfileVideo).toHaveBeenCalledWith(
      userId,
      0,
      expect.objectContaining({
        originalname: 'my-video.mp4',
        mimetype: 'video/mp4',
        buffer: Buffer.from('video bytes'),
      }),
    );
  });

  it('clears a profile video slot', async () => {
    const userId = '65a000000000000000000001';
    usersService.removeProfileVideo.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(`/api/users/${userId}/profile-videos/1`)
      .expect(204);

    expect(usersService.removeProfileVideo).toHaveBeenCalledWith(userId, 1);
  });

  it('clears the profile picture', async () => {
    const userId = '65a000000000000000000001';
    usersService.removeProfilePicture.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(`/api/users/${userId}/profile-picture`)
      .expect(204);

    expect(usersService.removeProfilePicture).toHaveBeenCalledWith(userId);
  });
});
