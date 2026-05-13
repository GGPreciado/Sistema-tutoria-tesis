import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { Logro } from './logro.entity';
import { Evaluacion } from './evaluacion.entity';

@Entity('usuario_logros')
@Index('idx_usuario_logros_usuario', ['usuario_id'])
export class UsuarioLogro {
  @PrimaryColumn({ type: 'uuid' })
  usuario_id: string;

  @PrimaryColumn({ type: 'uuid' })
  logro_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  obtenido_en: Date;

  @Column({ type: 'uuid', nullable: true })
  evaluacion_id: string | null;

  @ManyToOne(() => Usuario, (usuario) => usuario.usuario_logros, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Logro, (logro) => logro.usuario_logros, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'logro_id' })
  logro: Logro;

  @ManyToOne(() => Evaluacion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'evaluacion_id' })
  evaluacion: Evaluacion | null;
}
