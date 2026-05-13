import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { AccionAdaptativa, NivelDificultad } from '../enums';
import { Evaluacion } from './evaluacion.entity';

@Entity('resultados_evaluacion')
@Check('"nota" BETWEEN 0 AND 100')
export class ResultadoEvaluacion {
  @PrimaryColumn({ type: 'uuid' })
  evaluacion_id: string;

  @Column({ type: 'int' })
  nota: number;

  @Column({ type: 'int', default: 0 })
  puntaje_logro: number;

  @Column({ type: 'int', default: 0 })
  num_aciertos: number;

  @Column({ type: 'int', default: 0 })
  num_errores: number;

  @Column({ type: 'int', default: 0 })
  num_aciertos_consecutivos: number;

  @Column({ type: 'int', default: 0 })
  num_errores_consecutivos: number;

  @Column({ type: 'int', default: 0 })
  tiempo_promedio_respuesta: number;

  @Column({ type: 'decimal', precision: 4, scale: 3, nullable: true })
  indice_desempeno: number | null;

  @Column({ type: 'enum', enum: NivelDificultad })
  dificultad_actual: NivelDificultad;

  @Column({ type: 'enum', enum: AccionAdaptativa })
  accion_adaptativa: AccionAdaptativa;

  @Column({ type: 'text', nullable: true })
  mensaje_adaptativo: string | null;

  @OneToOne(() => Evaluacion, (evaluacion) => evaluacion.resultado, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'evaluacion_id' })
  evaluacion: Evaluacion;
}
