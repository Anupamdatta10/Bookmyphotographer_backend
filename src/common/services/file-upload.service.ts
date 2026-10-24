import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_VIDEO_FILE_SIZE = 15 * 1024 * 1024;

@Injectable()
export class FileUploadService {
  private readonly uploadPath = join(process.cwd(), 'public', 'uploads');
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly allowedVideoMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/ogg',
    'video/x-matroska',
  ];
  private readonly videoExtensions: Record<string, string> = {
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'video/ogg': '.ogv',
    'video/x-matroska': '.mkv',
  };
  private readonly maxFileSize = MAX_IMAGE_FILE_SIZE;

  constructor() {
    // Ensure upload directory exists
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, subfolder: string = ''): Promise<string> {
    this.validateFile(file);

    return this.saveUploadedFile(file, subfolder);
  }

  async uploadVideoFile(file: Express.Multer.File): Promise<string> {
    this.validateVideoFile(file);
    return this.saveUploadedFile(
      file,
      'videos',
      this.videoExtensions[file.mimetype],
    );
  }

  async uploadMultipleFiles(files: Express.Multer.File[], subfolder: string = ''): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, subfolder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(publicUrl: string): Promise<void> {
    try {
      if (!publicUrl) return;

      const normalizedUrl = publicUrl.split('?')[0];
      const pathname = normalizedUrl.startsWith('http')
        ? new URL(normalizedUrl).pathname
        : normalizedUrl;

      const pathParts = pathname.replace(/^\/+/, '').split('/');
      const filename = pathParts.pop();
      if (!filename) return;

      const possiblePaths = new Set<string>([
        join(this.uploadPath, filename),
        join(this.uploadPath, 'profiles', filename),
        join(this.uploadPath, 'galleries', filename),
        join(this.uploadPath, 'hero_imgs', filename),
      ]);

      if (pathParts.length > 0) {
        const folder = pathParts[pathParts.length - 1];
        possiblePaths.add(join(this.uploadPath, folder, filename));
      }

      for (const filePath of possiblePaths) {
        if (existsSync(filePath)) {
          const { unlinkSync } = await import('fs');
          unlinkSync(filePath);
          return;
        }
      }
    } catch (error) {
      // Log error but don't throw - file deletion is not critical
      console.warn('Failed to delete file:', error);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`
      );
    }
  }

  private validateVideoFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No video file provided');
    }

    if (!this.allowedVideoMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid video type. Allowed types: ${this.allowedVideoMimeTypes.join(', ')}`,
      );
    }

    if (file.size > MAX_VIDEO_FILE_SIZE) {
      throw new BadRequestException(
        `Video too large. Maximum size: ${MAX_VIDEO_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }
  }

  private async saveUploadedFile(
    file: Express.Multer.File,
    subfolder: string,
    fileExtension?: string,
  ): Promise<string> {
    const targetPath = subfolder ? join(this.uploadPath, subfolder) : this.uploadPath;
    if (!existsSync(targetPath)) {
      mkdirSync(targetPath, { recursive: true });
    }

    const extension = fileExtension ?? this.getExtension(file.originalname);
    const filename = `${randomUUID()}${extension}`;
    await this.saveFile(file, join(targetPath, filename));

    return subfolder
      ? `/public/uploads/${subfolder}/${filename}`
      : `/public/uploads/${filename}`;
  }

  private getExtension(filename: string): string {
    const ext = filename.substring(filename.lastIndexOf('.'));
    return ext.toLowerCase();
  }

  private async saveFile(file: Express.Multer.File, filePath: string): Promise<void> {
    const { writeFileSync } = await import('fs');
    writeFileSync(filePath, file.buffer);
  }

  getUploadPath(): string {
    return this.uploadPath;
  }
}