import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialMediaLinksController } from './social-media-links.controller';
import { SocialMediaLinksService } from './social-media-links.service';
import { SocialMediaLink, SocialMediaLinkSchema } from '../schemas/social-media-link.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SocialMediaLink.name, schema: SocialMediaLinkSchema },
    ]),
  ],
  controllers: [SocialMediaLinksController],
  providers: [SocialMediaLinksService],
  exports: [SocialMediaLinksService],
})
export class SocialMediaLinksModule {}