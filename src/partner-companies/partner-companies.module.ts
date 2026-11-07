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
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PartnerCompany.name, schema: PartnerCompanySchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    AdminsModule,
    CommonModule,
  ],
  controllers: [PartnerCompaniesController],
  providers: [PartnerCompaniesService],
  exports: [PartnerCompaniesService],
})
export class PartnerCompaniesModule {}