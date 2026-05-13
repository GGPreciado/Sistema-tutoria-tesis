import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Curso } from '../../database/entities/curso.entity';
import { Tema } from '../../database/entities/tema.entity';

export interface CursoDto {
  id: number;
  nombre: string;
}

export interface TemaDto {
  id: number;
  nombre: string;
  grado: number;
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Curso)
    private readonly cursoRepo: Repository<Curso>,
    @InjectRepository(Tema)
    private readonly temaRepo: Repository<Tema>,
  ) {}

  async findAll(): Promise<CursoDto[]> {
    const cursos = await this.cursoRepo.find({ order: { id: 'ASC' } });
    return cursos.map((c) => ({ id: c.id, nombre: c.nombre }));
  }

  async findTopicsByCourse(cursoId: number): Promise<TemaDto[]> {
    const curso = await this.cursoRepo.findOne({ where: { id: cursoId } });
    if (!curso) {
      throw new NotFoundException(`Curso con id ${cursoId} no encontrado`);
    }
    const temas = await this.temaRepo.find({
      where: { curso_id: cursoId },
      order: { grado: 'ASC', id: 'ASC' },
    });
    return temas.map((t) => ({ id: t.id, nombre: t.nombre, grado: t.grado }));
  }
}
