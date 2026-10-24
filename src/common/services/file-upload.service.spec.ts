import { existsSync } from 'fs';
import { basename, join } from 'path';
import { FileUploadService, MAX_VIDEO_FILE_SIZE } from './file-upload.service';

describe('FileUploadService video uploads', () => {
  const fileUploadService = new FileUploadService();
  const uploadedUrls: string[] = [];

  afterEach(async () => {
    await Promise.all(
      uploadedUrls.splice(0).map((url) => fileUploadService.deleteFile(url)),
    );
  });

  it('stores videos with unique names in the shared videos folder', async () => {
    const file: Express.Multer.File = {
      originalname: 'sample.mp4',
      mimetype: 'video/mp4',
      size: 4,
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    const firstUrl = await fileUploadService.uploadVideoFile(file);
    uploadedUrls.push(firstUrl);
    const secondUrl = await fileUploadService.uploadVideoFile(file);
    uploadedUrls.push(secondUrl);

    const firstName = basename(firstUrl);
    const secondName = basename(secondUrl);
    const videosFolder = join(process.cwd(), 'public', 'uploads', 'videos');

    expect(firstUrl).toMatch(/^\/public\/uploads\/videos\/.+\.mp4$/);
    expect(secondUrl).toMatch(/^\/public\/uploads\/videos\/.+\.mp4$/);
    expect(firstName).not.toBe(secondName);
    expect(existsSync(join(videosFolder, firstName))).toBe(true);
    expect(existsSync(join(videosFolder, secondName))).toBe(true);
  });

  it('rejects videos larger than 15 MB', async () => {
    await expect(
      fileUploadService.uploadVideoFile({
        originalname: 'large.mp4',
        mimetype: 'video/mp4',
        size: MAX_VIDEO_FILE_SIZE + 1,
        buffer: Buffer.alloc(0),
      } as Express.Multer.File),
    ).rejects.toThrow('Video too large');
  });
});
