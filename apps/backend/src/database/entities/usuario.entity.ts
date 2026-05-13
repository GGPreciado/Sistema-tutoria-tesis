import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoUsuario, RolUsuario } from '../enums';
import { Evaluacion } from './evaluacion.entity';
import { PuntosCurso } from './puntos-curso.entity';
import { UsuarioLogro } from './usuario-logro.entity';

@Entity('usuarios')
@Index('idx_usuarios_codigo', ['codigo'])
@Index('idx_usuarios_rol', ['rol'])
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'varchar', length: 40, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'enum', enum: RolUsuario, default: RolUsuario.ESTUDIANTE })
  rol: RolUsuario;

  @Column({ type: 'enum', enum: EstadoUsuario, default: EstadoUsuario.ACTIVO })
  estado: EstadoUsuario;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @OneToMany(() => Evaluacion, (evaluacion) => evaluacion.usuario)
  evaluaciones: Evaluacion[];

  @OneToMany(() => PuntosCurso, (puntos) => puntos.usuario)
  puntos_cursos: PuntosCurso[];

  @OneToMany(() => UsuarioLogro, (ul) => ul.usuario)
  usuario_logros: UsuarioLogro[];
}
