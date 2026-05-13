import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../database/entities/usuario.entity';
import { EstadoUsuario, RolUsuario } from '../../database/enums';

export interface UsuarioLoginResponse {
  id: string;
  nombre: string;
  codigo: string;
  rol: RolUsuario;
}

export interface IAuthService {
  login(codigo: string, password: string): Promise<{ usuario: UsuarioLoginResponse }>;
}

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async login(
    codigo: string,
    password: string,
  ): Promise<{ usuario: UsuarioLoginResponse }> {
    const usuario = await this.usuarioRepo.findOne({ where: { codigo } });

    if (!usuario || usuario.estado !== EstadoUsuario.ACTIVO) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        codigo: usuario.codigo,
        rol: usuario.rol,
      },
    };
  }
}
