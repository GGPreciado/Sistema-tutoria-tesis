import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Evaluacion } from './evaluacion.entity';
import { Pregunta } from './pregunta.entity';
import { Opcion } from './opcion.entity';

@Entity('respuestas_evaluacion')
@Index('idx_respuestas_evaluacion', ['evaluacion_id'])
export class RespuestaEvaluacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  evaluacion_id: string;

  @Column({ type: 'int' })
  pregunta_id: number;

  @Column({ type: 'int' })
  opcion_id: number;

  @Column({ type: 'boolean' })
  es_correcta: boolean;

  @Column({ type: 'int', nullable: true })
  tiempo_respuesta_seg: number | null;

  @ManyToOne(() => Evaluacion, (evaluacion) => evaluacion.respuestas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'evaluacion_id' })
  evaluacion: Evaluacion;

  @ManyToOne(() => Pregunta, (pregunta) => pregunta.respuestas)
  @JoinColumn({ name: 'pregunta_id' })
  pregunta: Pregunta;

  @ManyToOne(() => Opcion, (opcion) => opcion.respuestas)
  @JoinColumn({ name: 'opcion_id' })
  opcion: Opcion;
}
