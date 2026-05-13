import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Evaluacion } from '../../database/entities/evaluacion.entity';
import { Logro } from '../../database/entities/logro.entity';
import { PuntosCurso } from '../../database/entities/puntos-curso.entity';
import { UsuarioLogro } from '../../database/entities/usuario-logro.entity';
import { NivelDificultad } from '../../database/enums';

export interface ContextoGamificacion {
  nota: number;
  tiempoPromedioRespuesta: number;
  numAciertosConsecutivos: number;
  dificultadActual: NivelDificultad;
}

export interface LogroDesbloqueado {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface RankingActualizado {
  cursoId: number;
  puntosTotal: number;
  posicion: number;
}

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(PuntosCurso)
    private readonly puntosCursoRepo: Repository<PuntosCurso>,
    @InjectRepository(Logro)
    private readonly logroRepo: Repository<Logro>,
    @InjectRepository(UsuarioLogro)
    private readonly usuarioLogroRepo: Repository<UsuarioLogro>,
    @InjectRepository(Evaluacion)
    private readonly evaluacionRepo: Repository<Evaluacion>,
  ) {}

  /**
   * Suma puntos al acumulado del usuario en el curso. Crea la fila si no existe.
   * Recalcula la posición del usuario entre todos los participantes del curso.
   */
  async asignarPuntos(
    usuarioId: string,
    cursoId: number,
    puntos: number,
  ): Promise<RankingActualizado> {
    let puntosCurso = await this.puntosCursoRepo.findOne({
      where: { usuario_id: usuarioId, curso_id: cursoId },
    });

    if (!puntosCurso) {
      puntosCurso = this.puntosCursoRepo.create({
        usuario_id: usuarioId,
        curso_id: cursoId,
        puntos_total: puntos,
        posicion: null,
      });
    } else {
      puntosCurso.puntos_total += puntos;
    }

    await this.puntosCursoRepo.save(puntosCurso);

    // Posición = cuántos usuarios tienen MÁS puntos + 1
    const posicion =
      (await this.puntosCursoRepo
        .createQueryBuilder('pc')
        .where('pc.curso_id = :cursoId', { cursoId })
        .andWhere('pc.puntos_total > :puntos', { puntos: puntosCurso.puntos_total })
        .getCount()) + 1;

    puntosCurso.posicion = posicion;
    await this.puntosCursoRepo.save(puntosCurso);

    return {
      cursoId,
      puntosTotal: puntosCurso.puntos_total,
      posicion,
    };
  }

  /**
   * Evalúa los 8 criterios de logros contra el contexto de la evaluación recién finalizada.
   * Inserta en usuario_logros solo los que aún no estaban desbloqueados.
   * Devuelve la lista de logros recién desbloqueados.
   */
  async verificarLogros(
    usuarioId: string,
    evaluacionId: string,
    contexto: ContextoGamificacion,
  ): Promise<LogroDesbloqueado[]> {
    const [todosLogros, yaDesbloqueados, totalEvaluaciones] = await Promise.all([
      this.logroRepo.find(),
      this.usuarioLogroRepo.find({
        where: { usuario_id: usuarioId },
        select: ['logro_id'],
      }),
      this.evaluacionRepo.count({
        where: {
          usuario_id: usuarioId,
          finalizado_en: Not(IsNull()),
        },
      }),
    ]);

    const yaDesbloqueadosSet = new Set(yaDesbloqueados.map((ul) => ul.logro_id));

    const criteriosCumplidos = new Set<string>();

    if (totalEvaluaciones >= 1) criteriosCumplidos.add('primer_examen');
    if (contexto.nota === 100) criteriosCumplidos.add('examen_perfecto');
    if (contexto.tiempoPromedioRespuesta < 20) criteriosCumplidos.add('velocista');
    if (contexto.numAciertosConsecutivos >= 5) criteriosCumplidos.add('racha_5');
    if (contexto.numAciertosConsecutivos >= 10) criteriosCumplidos.add('racha_10');
    if (
      contexto.dificultadActual === NivelDificultad.DIFICIL ||
      contexto.dificultadActual === NivelDificultad.MUY_DIFICIL
    ) {
      criteriosCumplidos.add('nivel_avanzado');
    }
    if (totalEvaluaciones >= 5) criteriosCumplidos.add('constancia_5');
    if (totalEvaluaciones >= 10) criteriosCumplidos.add('dedicado_10');

    const nuevosLogros = todosLogros.filter(
      (l) => criteriosCumplidos.has(l.criterio) && !yaDesbloqueadosSet.has(l.id),
    );

    if (nuevosLogros.length === 0) return [];

    await this.usuarioLogroRepo.save(
      nuevosLogros.map((l) =>
        this.usuarioLogroRepo.create({
          usuario_id: usuarioId,
          logro_id: l.id,
          evaluacion_id: evaluacionId,
        }),
      ),
    );

    return nuevosLogros.map((l) => ({
      id: l.id,
      nombre: l.nombre,
      descripcion: l.descripcion,
    }));
  }
}
