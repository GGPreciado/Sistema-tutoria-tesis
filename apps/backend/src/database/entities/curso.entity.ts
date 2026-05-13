import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Tema } from './tema.entity';
import { Pregunta } from './pregunta.entity';
import { Evaluacion } from './evaluacion.entity';
import { PuntosCurso } from './puntos-curso.entity';

@Entity('cursos')
export class Curso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre: string;

  @OneToMany(() => Tema, (tema) => tema.curso)
  temas: Tema[];

  @OneToMany(() => Pregunta, (pregunta) => pregunta.curso)
  preguntas: Pregunta[];

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.curso)
  evaluaciones: Evaluacion[];

  @OneToMany(() => PuntosCurso, (puntos) => puntos.curso)
  puntos_cursos: PuntosCurso[];
}
