import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Curso } from './curso.entity';
import { Pregunta } from './pregunta.entity';
import { Evaluacion } from './evaluacion.entity';

@Entity('temas')
@Index('idx_temas_curso', ['curso_id'])
@Index('idx_temas_grado', ['grado'])
@Unique('idx_temas_curso_grado_nombre', ['curso_id', 'grado', 'nombre'])
@Check('"grado" BETWEEN 1 AND 6')
export class Tema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'int' })
  curso_id: number;

  @Column({ type: 'int' })
  grado: number;

  @ManyToOne(() => Curso, (curso) => curso.temas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'curso_id' })
  curso: Curso;

  @OneToMany(() => Pregunta, (pregunta) => pregunta.tema)
  preguntas: Pregunta[];

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.tema)
  evaluaciones: Evaluacion[];
}
