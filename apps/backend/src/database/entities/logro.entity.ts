import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsuarioLogro } from './usuario-logro.entity';

@Entity('logros')
export class Logro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'varchar', length: 80, unique: true })
  criterio: string;

  @Column({ type: 'text', nullable: true })
  icono_url: string | null;

  @OneToMany(() => UsuarioLogro, (ul) => ul.logro)
  usuario_logros: UsuarioLogro[];
}
