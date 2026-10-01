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
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminQueryDto,
  CreateAdminDto,
  UpdateAdminProfileDto,
} from './dto/admins.dto';
import {
  AdminSelfGuard,
  RequestWithAdmin,
  SuperAdminGuard,
} from './admin-auth.guard';
import { AdminsService } from './admins.service';

@ApiTags('admins')
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List normal admin accounts (superadmin only)' })
  @ApiResponse({ status: 200, description: 'Admin account list' })
  @UsePipes(new ValidationPipe({ transform: true }))
  findAll(@Query() query: AdminQueryDto) {
    return this.adminsService.findAll(query);
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a normal admin account (superadmin only)' })
  @ApiResponse({ status: 201, description: 'Admin account created' })
  @UsePipes(new ValidationPipe({ transform: true }))
  create(@Body() createDto: CreateAdminDto) {
    return this.adminsService.create(createDto);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a normal admin account (superadmin only)' })
  @ApiResponse({ status: 204, description: 'Admin account deleted' })
  remove(@Param('id') id: string) {
    return this.adminsService.remove(id);
  }

  @Get('me')
  @UseGuards(AdminSelfGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the signed-in admin profile' })
  findSelf(@Req() request: RequestWithAdmin) {
    return this.adminsService.findSelf(request.adminPrincipal!.sub);
  }

  @Patch('me')
  @UseGuards(AdminSelfGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the signed-in admin profile only' })
  @UsePipes(new ValidationPipe({ transform: true }))
  updateSelf(
    @Req() request: RequestWithAdmin,
    @Body() updateDto: UpdateAdminProfileDto,
  ) {
    return this.adminsService.updateSelf(request.adminPrincipal!.sub, updateDto);
  }
}