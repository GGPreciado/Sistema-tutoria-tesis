import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pregunta } from './pregunta.entity';
import { RespuestaEvaluacion } from './respuesta-evaluacion.entity';

@Entity('opciones')
@Index('idx_opciones_pregunta', ['pregunta_id'])
export class Opcion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  pregunta_id: number;

  @Column({ type: 'text' })
  texto: string;

  @Column({ type: 'boolean', default: false })
  es_correcta: boolean;

  @ManyToOne(() => Pregunta, (pregunta) => pregunta.opciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pregunta_id' })
  pregunta: Pregunta;

  @OneToMany(() => RespuestaEvaluacion, (respuesta) => respuesta.opcion)
  respuestas: RespuestaEvaluacion[];
}
