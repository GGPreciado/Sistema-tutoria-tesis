import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluacion } from '../../database/entities/evaluacion.entity';
import { Opcion } from '../../database/entities/opcion.entity';
import { Pregunta } from '../../database/entities/pregunta.entity';
import { RespuestaEvaluacion } from '../../database/entities/respuesta-evaluacion.entity';
import { ResultadoEvaluacion } from '../../database/entities/resultado-evaluacion.entity';
import { Tema } from '../../database/entities/tema.entity';
import { Usuario } from '../../database/entities/usuario.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AdaptiveModule } from '../adaptive/adaptive.module';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Evaluacion,
      RespuestaEvaluacion,
      ResultadoEvaluacion,
      Pregunta,
      Opcion,
      Tema,
      Usuario,
    ]),
    AdaptiveModule,
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsService, AuthGuard],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
