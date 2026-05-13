import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Usuario } from '../../database/entities/usuario.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { FinalizeEvaluationDto } from './dto/finalize-evaluation.dto';
import { EvaluationsService } from './evaluations.service';

@Controller('evaluations')
@UseGuards(AuthGuard)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  crear(
    @CurrentUser() usuario: Usuario,
    @Body() dto: CreateEvaluationDto,
  ) {
    return this.evaluationsService.crear(usuario, dto.temaId);
  }

  @Post(':evaluacionId/finalize')
  @HttpCode(HttpStatus.OK)
  finalizar(
    @CurrentUser() usuario: Usuario,
    @Param('evaluacionId', new ParseUUIDPipe()) evaluacionId: string,
    @Body() dto: FinalizeEvaluationDto,
  ) {
    return this.evaluationsService.finalizar(evaluacionId, usuario, dto.respuestas);
  }
}
