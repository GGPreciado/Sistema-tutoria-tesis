export interface Opcion {
  id: number;
  texto: string;
}

export interface Pregunta {
  id: number;
  enunciado: string;
  opciones: Opcion[];
}

export interface Evaluacion {
  evaluacionId: string;
  temaId: number;
  temaNombre: string;
  preguntas: Pregunta[];
}

export interface RespuestaEnvio {
  preguntaId: number;
  opcionId: number;
  tiempoRespuestaSeg: number;
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

export interface ResultadoEvaluacion {
  nota: number;
  numAciertos: number;
  numErrores: number;
  numAciertosConsecutivos: number;
  numErroresConsecutivos: number;
  tiempoPromedioRespuesta: number;
  indiceDesempeno: number;
  dificultadActual: 'facil' | 'normal' | 'dificil';
  accionAdaptativa: 'subir' | 'mantener' | 'bajar';
  mensajeAdaptativo: string;
  puntosGanados: number;
  logrosDesbloqueados: LogroDesbloqueado[];
  rankingActualizado: RankingActualizado;
}
