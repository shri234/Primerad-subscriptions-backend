import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserDocument } from '../../user/schema/user.schema';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user?: UserDocument | null;
}

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserDocument | null => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user ?? null;
  },
);
