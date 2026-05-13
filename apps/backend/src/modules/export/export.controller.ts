import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ExportService } from './export.service';

@Controller('admin')
@UseGuards(AuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('export')
  async exportarCsv(
    @Headers('x-admin-token') adminToken: string | undefined,
    @Query('desde') desde: string | undefined,
    @Query('hasta') hasta: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const tokenEsperado = process.env['ADMIN_EXPORT_TOKEN'];

    if (!adminToken || adminToken !== tokenEsperado) {
      throw new ForbiddenException('X-Admin-Token inválido o ausente');
    }

    const csv = await this.exportService.generarCsv({ desde, hasta });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="evaluaciones.csv"',
    );
    res.status(200).send(csv);
  }
}
