import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PartnerCompany,
  PartnerCompanySchema,
} from '../schemas/partner-company.schema';
import { PartnerCompaniesController } from './partner-companies.controller';
import { PartnerCompaniesService } from './partner-companies.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PartnerCompany.name, schema: PartnerCompanySchema },
    ]),
  ],
  controllers: [PartnerCompaniesController],
  providers: [PartnerCompaniesService],
  exports: [PartnerCompaniesService],
})
export class PartnerCompaniesModule {}