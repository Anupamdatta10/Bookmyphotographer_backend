import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagUserRelationsController } from './tag-user-relations.controller';
import { TagUserRelationsService } from './tag-user-relations.service';
import { TagUserRelation, TagUserRelationSchema } from '../schemas/tag-user-relation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TagUserRelation.name, schema: TagUserRelationSchema },
    ]),
  ],
  controllers: [TagUserRelationsController],
  providers: [TagUserRelationsService],
  exports: [TagUserRelationsService],
})
export class TagUserRelationsModule {}