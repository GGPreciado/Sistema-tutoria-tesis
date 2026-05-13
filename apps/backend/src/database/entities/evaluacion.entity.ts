import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoEvaluacion } from '../enums';
import { Usuario } from './usuario.entity';
import { Curso } from './curso.entity';
import { Tema } from './tema.entity';
import { RespuestaEvaluacion } from './respuesta-evaluacion.entity';
import { ResultadoEvaluacion } from './resultado-evaluacion.entity';

@Entity('evaluaciones')
@Index('idx_evaluaciones_usuario', ['usuario_id'])
@Index('idx_evaluaciones_creado', ['creado_en'])
@Check('"grado" BETWEEN 1 AND 6')
export class Evaluacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  usuario_id: string;

  @Column({ type: 'enum', enum: TipoEvaluacion })
  tipo: TipoEvaluacion;

  @Column({ type: 'int' })
  curso_id: number;

  @Column({ type: 'int', nullable: true })
  tema_id: number | null;

  @Column({ type: 'int' })
  grado: number;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finalizado_en: Date | null;

  @ManyToOne(() => Usuario, (usuario) => usuario.evaluaciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Curso, (curso) => curso.evaluaciones)
  @JoinColumn({ name: 'curso_id' })
  curso: Curso;

  @ManyToOne(() => Tema, (tema) => tema.evaluaciones, { nullable: true })
  @JoinColumn({ name: 'tema_id' })
  tema: Tema | null;

  @OneToMany(() => RespuestaEvaluacion, (respuesta) => respuesta.evaluacion)
  respuestas: RespuestaEvaluacion[];

  @OneToOne(() => ResultadoEvaluacion, (resultado) => resultado.evaluacion)
  resultado: ResultadoEvaluacion;
}
