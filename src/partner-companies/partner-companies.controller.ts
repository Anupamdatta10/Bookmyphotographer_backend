import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreatePartnerCompanyDto,
  PartnerCompanyQueryDto,
  UpdatePartnerCompanyDto,
} from './dto/partner-company.dto';
import { PartnerCompaniesService } from './partner-companies.service';

@ApiTags('partner-companies')
@Controller('partner-companies')
export class PartnerCompaniesController {
  constructor(
    private readonly partnerCompaniesService: PartnerCompaniesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a partner company' })
  @ApiResponse({ status: 201, description: 'Partner company created' })
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() createDto: CreatePartnerCompanyDto) {
    return this.partnerCompaniesService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'List partner companies with optional filters' })
  @ApiResponse({ status: 200, description: 'Partner companies and total count' })
  @UsePipes(new ValidationPipe({ transform: true }))
  findAll(@Query() query: PartnerCompanyQueryDto) {
    return this.partnerCompaniesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a partner company by ID' })
  @ApiParam({ name: 'id', description: 'Partner company ID' })
  @ApiResponse({ status: 200, description: 'Partner company found' })
  findOne(@Param('id') id: string) {
    return this.partnerCompaniesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a partner company' })
  @ApiParam({ name: 'id', description: 'Partner company ID' })
  @ApiResponse({ status: 200, description: 'Partner company updated' })
  @UsePipes(new ValidationPipe({ transform: true }))
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePartnerCompanyDto,
  ) {
    return this.partnerCompaniesService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a partner company' })
  @ApiParam({ name: 'id', description: 'Partner company ID' })
  @ApiResponse({ status: 204, description: 'Partner company removed' })
  remove(@Param('id') id: string): Promise<void> {
    return this.partnerCompaniesService.remove(id);
  }
}