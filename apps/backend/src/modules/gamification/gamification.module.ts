import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluacion } from '../../database/entities/evaluacion.entity';
import { Logro } from '../../database/entities/logro.entity';
import { PuntosCurso } from '../../database/entities/puntos-curso.entity';
import { TiempoUsuario } from '../../database/entities/tiempo-usuario.entity';
import { UsuarioLogro } from '../../database/entities/usuario-logro.entity';
import { GamificationService } from './gamification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PuntosCurso, Logro, UsuarioLogro, Evaluacion, TiempoUsuario]),
  ],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
