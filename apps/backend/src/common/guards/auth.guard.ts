import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { Usuario } from '../../database/entities/usuario.entity';
import { EstadoUsuario } from '../../database/enums';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.headers['x-user-id'] as string | undefined;

    if (!userId) {
      throw new UnauthorizedException('Header X-User-Id requerido');
    }

    const usuario = await this.usuarioRepo.findOne({ where: { id: userId } });

    if (!usuario || usuario.estado !== EstadoUsuario.ACTIVO) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    (request as Request & { user: Usuario }).user = usuario;
    return true;
  }
}
