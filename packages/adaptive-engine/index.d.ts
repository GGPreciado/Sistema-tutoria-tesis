/**
 * Input del motor adaptativo.
 * Construido a partir de las métricas calculadas al finalizar una evaluación.
 */
export interface AdaptiveInput {
  nota: number;                     // 0–100
  aciertosConsecutivos: number;
  erroresConsecutivos: number;
  tiempoPromedioRespuesta: number;  // segundos
  dificultadActual: NivelDificultad;
}

/**
 * Decisión devuelta por el motor.
 */
export interface AdaptiveDecision {
  accion: 'subir' | 'mantener' | 'bajar';
  mensaje: string;
}

export type NivelDificultad =
  | 'muy_facil'
  | 'facil'
  | 'normal'
  | 'dificil'
  | 'muy_dificil';

export function evaluar(input: AdaptiveInput): Promise<AdaptiveDecision>;
