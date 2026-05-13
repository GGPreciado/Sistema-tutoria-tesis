import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluacion } from '../../database/entities/evaluacion.entity';
import { Usuario } from '../../database/entities/usuario.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [TypeOrmModule.forFeature([Evaluacion, Usuario])],
  controllers: [ExportController],
  providers: [ExportService, AuthGuard],
})
export class ExportModule {}
