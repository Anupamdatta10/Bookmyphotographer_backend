import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Model, Types } from 'mongoose';
import { Admin, AdminDocument, AdminType } from '../schemas/admin.schema';

export interface AdminJwtPayload {
  sub: string;
  type: string;
  accountCollection: 'users' | 'admins';
}

export interface RequestWithAdmin extends Request {
  adminPrincipal?: AdminJwtPayload;
}

function getBearerToken(request: Request): string {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw new UnauthorizedException('Bearer token is required');
  }
  return authorization.slice('Bearer '.length);
}

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    let payload: AdminJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<AdminJwtPayload>(
        getBearerToken(request),
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (
      payload.accountCollection !== 'admins' ||
      payload.type !== AdminType.SUPERADMIN ||
      !Types.ObjectId.isValid(payload.sub)
    ) {
      throw new ForbiddenException('Superadmin access is required');
    }

    const superAdmin = await this.adminModel
      .findOne({
        _id: payload.sub,
        type: AdminType.SUPERADMIN,
        deletedAt: { $exists: false },
      })
      .select('_id')
      .exec();
    if (!superAdmin) {
      throw new ForbiddenException('Superadmin access is required');
    }

    request.adminPrincipal = payload;
    return true;
  }
}

@Injectable()
export class AdminSelfGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    let payload: AdminJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<AdminJwtPayload>(
        getBearerToken(request),
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (
      payload.accountCollection !== 'admins' ||
      ![AdminType.ADMIN, AdminType.SUPERADMIN].includes(payload.type as AdminType) ||
      !Types.ObjectId.isValid(payload.sub)
    ) {
      throw new ForbiddenException('Admin account access is required');
    }

    const admin = await this.adminModel
      .findOne({
        _id: payload.sub,
        type: payload.type,
        deletedAt: { $exists: false },
      })
      .select('_id')
      .exec();
    if (!admin) {
      throw new ForbiddenException('Admin account access is required');
    }

    request.adminPrincipal = payload;
    return true;
  }
}