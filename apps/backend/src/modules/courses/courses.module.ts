import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Curso } from '../../database/entities/curso.entity';
import { Tema } from '../../database/entities/tema.entity';
import { Usuario } from '../../database/entities/usuario.entity';
import { Pregunta } from '../../database/entities/pregunta.entity';
import { Opcion } from '../../database/entities/opcion.entity';
import { Evaluacion } from '../../database/entities/evaluacion.entity';
import { RespuestaEvaluacion } from '../../database/entities/respuesta-evaluacion.entity';
import { ResultadoEvaluacion } from '../../database/entities/resultado-evaluacion.entity';

@Module({
  // Se registran todas las entidades del grafo de Tema/Pregunta/Evaluacion para que
  // TypeORM pueda resolver las relaciones inversas con autoLoadEntities.
  // Usuario se incluye para que AuthGuard pueda inyectar su repositorio.
  imports: [
    TypeOrmModule.forFeature([
      Curso,
      Tema,
      Usuario,
      Pregunta,
      Opcion,
      Evaluacion,
      RespuestaEvaluacion,
      ResultadoEvaluacion,
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService, AuthGuard],
  exports: [CoursesService],
})
export class CoursesModule {}
