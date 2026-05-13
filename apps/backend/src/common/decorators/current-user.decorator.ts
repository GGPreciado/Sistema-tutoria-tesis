import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Usuario } from '../../database/entities/usuario.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Usuario => {
    const request = ctx.switchToHttp().getRequest<Request & { user: Usuario }>();
    return request.user;
  },
);
