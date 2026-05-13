import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluacion } from '../../database/entities/evaluacion.entity';

interface FiltroFechas {
  desde?: string;
  hasta?: string;
}

const CABECERA =
  'usuario_id,usuario_codigo,usuario_nombre,evaluacion_id,curso,tema,grado,' +
  'creado_en,finalizado_en,nota,num_aciertos,num_errores,' +
  'num_aciertos_consecutivos,num_errores_consecutivos,' +
  'tiempo_promedio_respuesta,indice_desempeno,dificultad_actual,' +
  'accion_adaptativa,puntaje_logro';

function escaparCampo(valor: string | number | Date | null | undefined): string {
  if (valor === null || valor === undefined) return '';
  const str = valor instanceof Date ? valor.toISOString() : String(valor);
  // Escapar si contiene coma, comillas o salto de línea
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Evaluacion)
    private readonly evaluacionRepo: Repository<Evaluacion>,
  ) {}

  async generarCsv(filtro: FiltroFechas): Promise<string> {
    const qb = this.evaluacionRepo
      .createQueryBuilder('e')
      .innerJoin('e.usuario', 'u')
      .innerJoin('e.curso', 'c')
      .leftJoin('e.tema', 't')
      .innerJoin('e.resultado', 'r')
      .select([
        'u.id            AS usuario_id',
        'u.codigo        AS usuario_codigo',
        'u.nombre        AS usuario_nombre',
        'e.id            AS evaluacion_id',
        'c.nombre        AS curso',
        't.nombre        AS tema',
        'e.grado         AS grado',
        'e.creado_en     AS creado_en',
        'e.finalizado_en AS finalizado_en',
        'r.nota          AS nota',
        'r.num_aciertos  AS num_aciertos',
        'r.num_errores   AS num_errores',
        'r.num_aciertos_consecutivos  AS num_aciertos_consecutivos',
        'r.num_errores_consecutivos   AS num_errores_consecutivos',
        'r.tiempo_promedio_respuesta  AS tiempo_promedio_respuesta',
        'r.indice_desempeno           AS indice_desempeno',
        'r.dificultad_actual          AS dificultad_actual',
        'r.accion_adaptativa          AS accion_adaptativa',
        'r.puntaje_logro              AS puntaje_logro',
      ])
      // Solo evaluaciones finalizadas
      .where('e.finalizado_en IS NOT NULL');

    if (filtro.desde) {
      qb.andWhere('e.finalizado_en >= :desde', { desde: filtro.desde });
    }
    if (filtro.hasta) {
      qb.andWhere('e.finalizado_en <= :hasta', { hasta: filtro.hasta });
    }

    qb.orderBy('e.finalizado_en', 'ASC');

    const filas = await qb.getRawMany<Record<string, unknown>>();

    const lineas = filas.map((f) =>
      [
        escaparCampo(f['usuario_id'] as string),
        escaparCampo(f['usuario_codigo'] as string),
        escaparCampo(f['usuario_nombre'] as string),
        escaparCampo(f['evaluacion_id'] as string),
        escaparCampo(f['curso'] as string),
        escaparCampo(f['tema'] as string),
        escaparCampo(f['grado'] as number),
        escaparCampo(f['creado_en'] as string),
        escaparCampo(f['finalizado_en'] as string),
        escaparCampo(f['nota'] as number),
        escaparCampo(f['num_aciertos'] as number),
        escaparCampo(f['num_errores'] as number),
        escaparCampo(f['num_aciertos_consecutivos'] as number),
        escaparCampo(f['num_errores_consecutivos'] as number),
        escaparCampo(f['tiempo_promedio_respuesta'] as number),
        escaparCampo(f['indice_desempeno'] as number),
        escaparCampo(f['dificultad_actual'] as string),
        escaparCampo(f['accion_adaptativa'] as string),
        escaparCampo(f['puntaje_logro'] as number),
      ].join(','),
    );

    return [CABECERA, ...lineas].join('\r\n');
  }
}
