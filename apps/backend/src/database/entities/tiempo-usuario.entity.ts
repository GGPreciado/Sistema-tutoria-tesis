import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('tiempo_usuario')
export class TiempoUsuario {
  @PrimaryColumn({ type: 'uuid' })
  usuario_id: string;

  @Column({ type: 'int', default: 0 })
  segundos_totales: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;

  @OneToOne(() => Usuario, (usuario) => usuario.tiempo_usuario, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
