import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NivelDificultad, TipoPregunta } from '../enums';
import { Curso } from './curso.entity';
import { Tema } from './tema.entity';
import { Opcion } from './opcion.entity';
import { RespuestaEvaluacion } from './respuesta-evaluacion.entity';

@Entity('preguntas')
@Index('idx_preguntas_tema', ['tema_id'])
@Index('idx_preguntas_curso', ['curso_id'])
@Index('idx_preguntas_dificultad', ['dificultad'])
@Check(
  `(tipo = 'diagnostica_curso' AND curso_id IS NOT NULL) OR (tipo = 'evaluacion_tema' AND tema_id IS NOT NULL)`,
)
export class Pregunta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  enunciado: string;

  @Column({ type: 'enum', enum: TipoPregunta })
  tipo: TipoPregunta;

  @Column({ type: 'int', nullable: true })
  curso_id: number | null;

  @Column({ type: 'int', nullable: true })
  tema_id: number | null;

  @Column({
    type: 'enum',
    enum: NivelDificultad,
    default: NivelDificultad.NORMAL,
  })
  dificultad: NivelDificultad;

  @ManyToOne(() => Curso, (curso) => curso.preguntas, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'curso_id' })
  curso: Curso | null;

  @ManyToOne(() => Tema, (tema) => tema.preguntas, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tema_id' })
  tema: Tema | null;

  @OneToMany(() => Opcion, (opcion) => opcion.pregunta)
  opciones: Opcion[];

  @OneToMany(() => RespuestaEvaluacion, (respuesta) => respuesta.pregunta)
  respuestas: RespuestaEvaluacion[];
}
