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
import { User, UserDocument } from '../schemas/user.schema';

export interface UserJwtPayload {
  sub: string;
  type: string;
  accountCollection: 'users' | 'admins';
}

export interface RequestWithUser extends Request {
  userPrincipal?: UserJwtPayload;
}

function getBearerToken(request: Request): string {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw new UnauthorizedException('Access token is required');
  }
  return authorization.slice('Bearer '.length);
}

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    let payload: UserJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<UserJwtPayload>(
        getBearerToken(request),
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (
      payload.accountCollection !== 'users' ||
      !Types.ObjectId.isValid(payload.sub)
    ) {
      throw new ForbiddenException('User account access is required');
    }

    const user = await this.userModel
      .findOne({
        _id: payload.sub,
        deletedAt: { $exists: false },
      })
      .select('_id')
      .exec();
    if (!user) {
      throw new ForbiddenException('User account access is required');
    }

    request.userPrincipal = payload;
    return true;
  }
}
