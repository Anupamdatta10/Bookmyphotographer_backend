import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HeroImg, HeroImgDocument } from '../schemas/hero-img.schema';
import { FileUploadService } from '@/common/services/file-upload.service';

@Injectable()
export class HeroImgsService {
  constructor(
    @InjectModel(HeroImg.name) private heroImgModel: Model<HeroImgDocument>,
    private fileUploadService: FileUploadService,
  ) {}

  async getConfig(): Promise<HeroImgDocument> {
    let config = await this.heroImgModel.findOne({ key: 'home' }).exec();
    if (config) return config;

    const legacyImages = await this.heroImgModel.db.collection('heroImgs')
      .find({ isActive: { $ne: false }, deletedAt: { $exists: false } })
      .sort({ sequence: 1 })
      .toArray();
    const images = legacyImages.map((image, index) => ({
      url: String(image.url),
      alt: String(image.alt || `Hero image ${index + 1}`),
      sequence: Number(image.sequence ?? index),
    }));

    config = await this.heroImgModel.create({ key: 'home', images });
    if (legacyImages.length) {
      await this.heroImgModel.db.collection('heroImgs').deleteMany({});
    }
    return config;
  }

  async updateConfig(values: Partial<Pick<HeroImg, 'title' | 'description' | 'script'>>): Promise<HeroImgDocument> {
    const config = await this.getConfig();
    if (typeof values.title === 'string') config.title = values.title;
    if (typeof values.description === 'string') config.description = values.description;
    if (typeof values.script === 'string') config.script = values.script;
    return config.save();
  }

  async addImages(files: Express.Multer.File[]): Promise<HeroImgDocument> {
    if (!files?.length) throw new BadRequestException('No files provided');
    const config = await this.getConfig();
    const urls = await this.fileUploadService.uploadMultipleFiles(files, 'hero_imgs');
    config.images.push(...urls.map((url, index) => ({
      url,
      alt: files[index].originalname,
      sequence: config.images.length + index,
    })));
    return config.save();
  }

  async removeImage(index: number): Promise<HeroImgDocument> {
    const config = await this.getConfig();
    if (!Number.isInteger(index) || index < 0 || index >= config.images.length) {
      throw new BadRequestException('Invalid hero image index');
    }
    const [removed] = config.images.splice(index, 1);
    config.images.forEach((image, imageIndex) => { image.sequence = imageIndex; });
    await config.save();
    if (removed.url) await this.fileUploadService.deleteFile(removed.url);
    return config;
  }
}