import { Injectable, BadRequestException } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class FileUploadService {
  private readonly uploadPath = join(process.cwd(), 'public', 'uploads');
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  constructor() {
    // Ensure upload directory exists
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, subfolder: string = ''): Promise<string> {
    // Validate file
    this.validateFile(file);

    // Create subfolder if specified
    const targetPath = subfolder ? join(this.uploadPath, subfolder) : this.uploadPath;
    if (!existsSync(targetPath)) {
      mkdirSync(targetPath, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const extension = this.getExtension(file.originalname);
    const filename = `${timestamp}-${randomSuffix}${extension}`;

    // Save file
    const filePath = join(targetPath, filename);
    await this.saveFile(file, filePath);

    // Return public URL
    const publicPath = subfolder ? `/public/uploads/${subfolder}/${filename}` : `/public/uploads/${filename}`;
    return publicPath;
  }

  async uploadMultipleFiles(files: Express.Multer.File[], subfolder: string = ''): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, subfolder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(publicUrl: string): Promise<void> {
    try {
      // Extract filename from public URL
      const filename = publicUrl.split('/').pop();
      if (!filename) return;

      // Try to find and delete the file
      const possiblePaths = [
        join(this.uploadPath, filename),
        join(this.uploadPath, 'profiles', filename),
        join(this.uploadPath, 'galleries', filename),
      ];

      for (const filePath of possiblePaths) {
        if (existsSync(filePath)) {
          const { unlinkSync } = await import('fs');
          unlinkSync(filePath);
          break;
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