import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UploadedFiles, UseInterceptors, UseGuards } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HeroImg } from '../schemas/hero-img.schema';
import { HeroImgsService } from './hero-imgs.service';
import { AdminSelfGuard } from '../admins/admin-auth.guard';

@ApiTags('hero-imgs')
@Controller('hero-imgs')
export class HeroImgsController {
  constructor(private readonly heroImgsService: HeroImgsService) {}

  @Get('config')
  // @UseGuards(AdminSelfGuard)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the home page hero configuration' })
  getConfig() {
    return this.heroImgsService.getConfig();
  }

  @Get('active')
  @UseGuards(AdminSelfGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active hero images' })
  async findActive() {
    const config = await this.heroImgsService.getConfig();
    return config.images;
  }

  @Patch('config')
  @UseGuards(AdminSelfGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update home page hero text' })
  updateConfig(@Body() body: Partial<Pick<HeroImg, 'title' | 'description' | 'script'>>) {
    return this.heroImgsService.updateConfig(body);
  }

  @Post('config/images')
  @UseGuards(AdminSelfGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add images to the home page hero configuration' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 20))
  addImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.heroImgsService.addImages(files);
  }

  @Delete('config/images/:index')
  @UseGuards(AdminSelfGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a hero image and its file' })
  removeImage(@Param('index', ParseIntPipe) index: number) {
    return this.heroImgsService.removeImage(index);
  }
}
