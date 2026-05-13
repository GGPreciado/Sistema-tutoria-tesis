import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Usuario } from '../../database/entities/usuario.entity';
import { PuntosCurso } from '../../database/entities/puntos-curso.entity';
import { UsuarioLogro } from '../../database/entities/usuario-logro.entity';
import { Logro } from '../../database/entities/logro.entity';
import { Curso } from '../../database/entities/curso.entity';

@Module({
  // Logro y Curso se registran aquí para que autoLoadEntities los incluya en el DataSource
  // y TypeORM pueda resolver las relaciones de PuntosCurso y UsuarioLogro.
  imports: [TypeOrmModule.forFeature([Usuario, PuntosCurso, UsuarioLogro, Logro, Curso])],
  controllers: [UsersController],
  providers: [UsersService, AuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
