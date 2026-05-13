import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { Curso } from './curso.entity';

@Entity('puntos_curso')
@Unique(['usuario_id', 'curso_id'])
@Index('idx_puntos_curso_curso', ['curso_id'])
export class PuntosCurso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  usuario_id: string;

  @Column({ type: 'int' })
  curso_id: number;

  @Column({ type: 'int', default: 0 })
  puntos_total: number;

  @Column({ type: 'int', nullable: true })
  posicion: number | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.puntos_cursos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Curso, (curso) => curso.puntos_cursos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'curso_id' })
  curso: Curso;
}
