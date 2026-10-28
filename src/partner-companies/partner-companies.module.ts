import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PartnerCompany,
  PartnerCompanySchema,
} from '../schemas/partner-company.schema';
import { PartnerCompaniesController } from './partner-companies.controller';
import { PartnerCompaniesService } from './partner-companies.service';
import { Admin, AdminSchema } from '../schemas/admin.schema';
import { AdminsModule } from '../admins/admins.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PartnerCompany.name, schema: PartnerCompanySchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    AdminsModule,
  ],
  controllers: [PartnerCompaniesController],
  providers: [PartnerCompaniesService],
  exports: [PartnerCompaniesService],
})
export class PartnerCompaniesModule {}