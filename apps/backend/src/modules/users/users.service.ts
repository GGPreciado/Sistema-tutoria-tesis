import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../database/entities/usuario.entity';
import { PuntosCurso } from '../../database/entities/puntos-curso.entity';
import { UsuarioLogro } from '../../database/entities/usuario-logro.entity';

export interface PuntosPorCurso {
  cursoId: number;
  cursoNombre: string;
  puntosTotal: number;
  posicion: number | null;
}

export interface LogroObtenido {
  id: string;
  nombre: string;
  descripcion: string;
  iconoUrl: string | null;
  obtenidoEn: Date;
}

export interface PerfilEstudiante {
  id: string;
  nombre: string;
  codigo: string;
  puntosTotal: number;
  puntosPorCurso: PuntosPorCurso[];
  logros: LogroObtenido[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(PuntosCurso)
    private readonly puntosCursoRepo: Repository<PuntosCurso>,
    @InjectRepository(UsuarioLogro)
    private readonly usuarioLogroRepo: Repository<UsuarioLogro>,
  ) {}

  async findById(id: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({ where: { id } });
  }

  async getFullProfile(userId: string): Promise<PerfilEstudiante> {
    const usuario = await this.usuarioRepo.findOne({ where: { id: userId } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const puntosCurso = await this.puntosCursoRepo.find({
      where: { usuario_id: userId },
      relations: ['curso'],
    });

    const usuarioLogros = await this.usuarioLogroRepo.find({
      where: { usuario_id: userId },
      relations: ['logro'],
    });

    const puntosTotal = puntosCurso.reduce((sum, pc) => sum + pc.puntos_total, 0);

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      codigo: usuario.codigo,
      puntosTotal,
      puntosPorCurso: puntosCurso.map((pc) => ({
        cursoId: pc.curso_id,
        cursoNombre: pc.curso.nombre,
        puntosTotal: pc.puntos_total,
        posicion: pc.posicion,
      })),
      logros: usuarioLogros.map((ul) => ({
        id: ul.logro_id,
        nombre: ul.logro.nombre,
        descripcion: ul.logro.descripcion,
        iconoUrl: ul.logro.icono_url,
        obtenidoEn: ul.obtenido_en,
      })),
    };
  }
}
