import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Evaluacion } from '../../database/entities/evaluacion.entity';
import { Opcion } from '../../database/entities/opcion.entity';
import { Pregunta } from '../../database/entities/pregunta.entity';
import { RespuestaEvaluacion } from '../../database/entities/respuesta-evaluacion.entity';
import { ResultadoEvaluacion } from '../../database/entities/resultado-evaluacion.entity';
import { Tema } from '../../database/entities/tema.entity';
import { Usuario } from '../../database/entities/usuario.entity';
import { NivelDificultad, TipoEvaluacion, TipoPregunta } from '../../database/enums';
import { AdaptiveService } from '../adaptive/adaptive.service';
import {
  GamificationService,
  LogroDesbloqueado,
  RankingActualizado,
} from '../gamification/gamification.service';
import { RespuestaItemDto } from './dto/finalize-evaluation.dto';

const ORDEN_DIFICULTAD: NivelDificultad[] = [
  NivelDificultad.MUY_FACIL,
  NivelDificultad.FACIL,
  NivelDificultad.NORMAL,
  NivelDificultad.DIFICIL,
  NivelDificultad.MUY_DIFICIL,
];

const TOTAL_PREGUNTAS = 8;
const CANT_NIVEL_ACTUAL = 5;
const CANT_NIVEL_ARRIBA = 2;
const CANT_NIVEL_ABAJO = 1;

// Interfaces de respuesta para los endpoints
export interface OpcionRespuestaDto {
  id: number;
  texto: string;
}

export interface PreguntaRespuestaDto {
  id: number;
  enunciado: string;
  opciones: OpcionRespuestaDto[];
}

export interface IniciarEvaluacionRespuesta {
  evaluacionId: string;
  temaId: number;
  temaNombre: string;
  preguntas: PreguntaRespuestaDto[];
}

export interface FinalizarEvaluacionRespuesta {
  nota: number;
  numAciertos: number;
  numErrores: number;
  numAciertosConsecutivos: number;
  numErroresConsecutivos: number;
  tiempoPromedioRespuesta: number;
  indiceDesempeno: number;
  dificultadActual: NivelDificultad;
  accionAdaptativa: string;
  mensajeAdaptativo: string;
  puntosGanados: number;
  logrosDesbloqueados: LogroDesbloqueado[];
  rankingActualizado: RankingActualizado | null;
}

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(Evaluacion)
    private readonly evaluacionRepo: Repository<Evaluacion>,
    @InjectRepository(RespuestaEvaluacion)
    private readonly respuestaRepo: Repository<RespuestaEvaluacion>,
    @InjectRepository(ResultadoEvaluacion)
    private readonly resultadoRepo: Repository<ResultadoEvaluacion>,
    @InjectRepository(Pregunta)
    private readonly preguntaRepo: Repository<Pregunta>,
    @InjectRepository(Opcion)
    private readonly opcionRepo: Repository<Opcion>,
    @InjectRepository(Tema)
    private readonly temaRepo: Repository<Tema>,
    private readonly adaptiveService: AdaptiveService,
    private readonly gamificationService: GamificationService,
  ) {}

  async crear(usuario: Usuario, temaId: number): Promise<IniciarEvaluacionRespuesta> {
    const tema = await this.temaRepo.findOne({
      where: { id: temaId },
      relations: ['curso'],
    });
    if (!tema) throw new NotFoundException(`Tema con id ${temaId} no encontrado`);

    const dificultadActual = await this.obtenerDificultadActual(usuario.id, temaId, null);

    const preguntas = await this.seleccionarPreguntas(temaId, dificultadActual);

    const evaluacion = this.evaluacionRepo.create({
      usuario_id: usuario.id,
      tipo: TipoEvaluacion.EVALUACION_TEMA,
      curso_id: tema.curso_id,
      tema_id: temaId,
      grado: tema.grado,
      finalizado_en: null,
    });
    const guardada = await this.evaluacionRepo.save(evaluacion);

    return {
      evaluacionId: guardada.id,
      temaId: tema.id,
      temaNombre: tema.nombre,
      preguntas: preguntas.map((p) => ({
        id: p.id,
        enunciado: p.enunciado,
        opciones: p.opciones.map((o) => ({ id: o.id, texto: o.texto })),
      })),
    };
  }

  async finalizar(
    evaluacionId: string,
    usuario: Usuario,
    respuestas: RespuestaItemDto[],
  ): Promise<FinalizarEvaluacionRespuesta> {
    const evaluacion = await this.evaluacionRepo.findOne({
      where: { id: evaluacionId },
    });

    if (!evaluacion) throw new NotFoundException('Evaluación no encontrada');
    if (evaluacion.usuario_id !== usuario.id) {
      throw new ForbiddenException('Evaluación no pertenece al usuario autenticado');
    }
    if (evaluacion.finalizado_en !== null) {
      throw new ConflictException('La evaluación ya fue finalizada');
    }

    // Cargar opciones para verificar es_correcta
    const opcionIds = respuestas.map((r) => r.opcionId);
    const opciones = await this.opcionRepo.findBy({ id: In(opcionIds) });
    const opcionMap = new Map(opciones.map((o) => [o.id, o]));

    // Construir registros de respuestas
    const filas = respuestas.map((r) => ({
      evaluacion_id: evaluacionId,
      pregunta_id: r.preguntaId,
      opcion_id: r.opcionId,
      es_correcta: opcionMap.get(r.opcionId)?.es_correcta ?? false,
      tiempo_respuesta_seg: r.tiempoRespuestaSeg,
    }));

    await this.respuestaRepo.save(filas);

    // Métricas
    const secuencia = filas.map((f) => f.es_correcta);
    const numAciertos = secuencia.filter(Boolean).length;
    const numErrores = secuencia.length - numAciertos;
    const numAciertosConsecutivos = this.rachaMaxima(secuencia, true);
    const numErroresConsecutivos = this.rachaMaxima(secuencia, false);
    const tiempos = filas.map((f) => f.tiempo_respuesta_seg ?? 0);
    const tiempoPromedio =
      tiempos.length > 0
        ? Math.round(tiempos.reduce((s, t) => s + t, 0) / tiempos.length)
        : 0;
    const nota = Math.round((numAciertos / secuencia.length) * 100);

    // Dificultad que estaba activa cuando el estudiante inició esta evaluación
    const dificultadAnterior = await this.obtenerDificultadActual(
      usuario.id,
      evaluacion.tema_id!,
      evaluacionId,
    );

    // Motor adaptativo
    const decision = await this.adaptiveService.evaluar({
      nota,
      aciertosConsecutivos: numAciertosConsecutivos,
      erroresConsecutivos: numErroresConsecutivos,
      tiempoPromedio,
      dificultadActual: dificultadAnterior,
    });

    const puntajeLogro = this.calcularPuntajeLogro(nota);

    // Persistir resultado
    const resultado = this.resultadoRepo.create({
      evaluacion_id: evaluacionId,
      nota,
      puntaje_logro: puntajeLogro,
      num_aciertos: numAciertos,
      num_errores: numErrores,
      num_aciertos_consecutivos: numAciertosConsecutivos,
      num_errores_consecutivos: numErroresConsecutivos,
      tiempo_promedio_respuesta: tiempoPromedio,
      indice_desempeno: decision.indiceDesempeno,
      dificultad_actual: decision.dificultadSiguiente,
      accion_adaptativa: decision.accion,
      mensaje_adaptativo: decision.mensaje,
    });
    await this.resultadoRepo.save(resultado);

    await this.evaluacionRepo.update(evaluacionId, { finalizado_en: new Date() });

    const [rankingActualizado, logrosDesbloqueados] = await Promise.all([
      this.gamificationService.asignarPuntos(
        usuario.id,
        evaluacion.curso_id,
        puntajeLogro,
      ),
      this.gamificationService.verificarLogros(usuario.id, evaluacionId, {
        nota,
        tiempoPromedioRespuesta: tiempoPromedio,
        numAciertosConsecutivos,
        dificultadActual: decision.dificultadSiguiente,
      }),
    ]);

    return {
      nota,
      numAciertos,
      numErrores,
      numAciertosConsecutivos,
      numErroresConsecutivos,
      tiempoPromedioRespuesta: tiempoPromedio,
      indiceDesempeno: decision.indiceDesempeno,
      dificultadActual: decision.dificultadSiguiente,
      accionAdaptativa: decision.accion,
      mensajeAdaptativo: decision.mensaje,
      puntosGanados: puntajeLogro,
      logrosDesbloqueados,
      rankingActualizado,
    };
  }

  // Devuelve la dificultad vigente del usuario para un tema.
  // Excluye evaluacionIdActual para no contar la evaluación en curso.
  private async obtenerDificultadActual(
    usuarioId: string,
    temaId: number,
    evaluacionIdActual: string | null,
  ): Promise<NivelDificultad> {
    let qb = this.resultadoRepo
      .createQueryBuilder('resultado')
      .innerJoin('resultado.evaluacion', 'evaluacion')
      .where('evaluacion.usuario_id = :usuarioId', { usuarioId })
      .andWhere('evaluacion.tema_id = :temaId', { temaId })
      .orderBy('evaluacion.creado_en', 'DESC');

    if (evaluacionIdActual) {
      qb = qb.andWhere('evaluacion.id != :evalId', { evalId: evaluacionIdActual });
    }

    const ultimo = await qb.getOne();
    return ultimo?.dificultad_actual ?? NivelDificultad.NORMAL;
  }

  private async seleccionarPreguntas(
    temaId: number,
    dificultadActual: NivelDificultad,
  ): Promise<Pregunta[]> {
    const indice = ORDEN_DIFICULTAD.indexOf(dificultadActual);
    const nivelArriba =
      indice < ORDEN_DIFICULTAD.length - 1 ? ORDEN_DIFICULTAD[indice + 1] : null;
    const nivelAbajo = indice > 0 ? ORDEN_DIFICULTAD[indice - 1] : null;

    const [actuales, arriba, abajo] = await Promise.all([
      this.preguntaRepo.find({
        where: {
          tema_id: temaId,
          dificultad: dificultadActual,
          tipo: TipoPregunta.EVALUACION_TEMA,
        },
        relations: ['opciones'],
      }),
      nivelArriba
        ? this.preguntaRepo.find({
            where: {
              tema_id: temaId,
              dificultad: nivelArriba,
              tipo: TipoPregunta.EVALUACION_TEMA,
            },
            relations: ['opciones'],
          })
        : Promise.resolve([]),
      nivelAbajo
        ? this.preguntaRepo.find({
            where: {
              tema_id: temaId,
              dificultad: nivelAbajo,
              tipo: TipoPregunta.EVALUACION_TEMA,
            },
            relations: ['opciones'],
          })
        : Promise.resolve([]),
    ]);

    const mezclar = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    let seleccionadas: Pregunta[] = [
      ...mezclar(actuales).slice(0, CANT_NIVEL_ACTUAL),
      ...mezclar(arriba).slice(0, CANT_NIVEL_ARRIBA),
      ...mezclar(abajo).slice(0, CANT_NIVEL_ABAJO),
    ];

    // Rellenar hasta TOTAL_PREGUNTAS si hay insuficientes
    if (seleccionadas.length < TOTAL_PREGUNTAS) {
      const usadas = new Set(seleccionadas.map((p) => p.id));
      const resto = [...actuales, ...arriba, ...abajo].filter((p) => !usadas.has(p.id));
      seleccionadas = [
        ...seleccionadas,
        ...mezclar(resto).slice(0, TOTAL_PREGUNTAS - seleccionadas.length),
      ];
    }

    return mezclar(seleccionadas).slice(0, TOTAL_PREGUNTAS);
  }

  private rachaMaxima(secuencia: boolean[], tipo: boolean): number {
    let max = 0;
    let actual = 0;
    for (const valor of secuencia) {
      if (valor === tipo) {
        actual++;
        if (actual > max) max = actual;
      } else {
        actual = 0;
      }
    }
    return max;
  }

  private calcularPuntajeLogro(nota: number): number {
    if (nota === 100) return 100;
    if (nota >= 80) return 50;
    if (nota >= 60) return 25;
    if (nota >= 40) return 10;
    return 0;
  }
}
