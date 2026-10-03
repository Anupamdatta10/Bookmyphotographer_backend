import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HeroImgDocument = HeroImg & Document;

@Schema({ _id: false })
export class HeroImage {
  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: String, default: '' })
  alt: string;

  @Prop({ type: Number, default: 0 })
  sequence: number;
}

export const HeroImageSchema = SchemaFactory.createForClass(HeroImage);

@Schema({ timestamps: true, collection: 'hero_img' })
export class HeroImg {
  @Prop({ type: String, required: true, default: 'home', unique: true })
  key: string;

  @Prop({ type: [HeroImageSchema], default: [] })
  images: HeroImage[];

  @Prop({ type: String, default: 'Find the Perfect\nPhotographer for Your Event' })
  title: string;

  @Prop({ type: String, default: 'Talented. Trusted. Available.' })
  description: string;

  @Prop({ type: String, default: 'Moments\nThat Last Forever' })
  script: string;
}

export const HeroImgSchema = SchemaFactory.createForClass(HeroImg);