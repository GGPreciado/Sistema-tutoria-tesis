import { Injectable } from '@nestjs/common';
import { evaluar as motorEvaluar } from '@sistema-tutoria/adaptive-engine';
import { AccionAdaptativa, NivelDificultad } from '../../database/enums';

export interface EntradaAdaptativa {
  nota: number;
  aciertosConsecutivos: number;
  erroresConsecutivos: number;
  tiempoPromedio: number;
  dificultadActual: NivelDificultad;
}

export interface DecisionAdaptativa {
  accion: AccionAdaptativa;
  mensaje: string;
  indiceDesempeno: number;
  dificultadSiguiente: NivelDificultad;
}

const ORDEN_DIFICULTAD: NivelDificultad[] = [
  NivelDificultad.MUY_FACIL,
  NivelDificultad.FACIL,
  NivelDificultad.NORMAL,
  NivelDificultad.DIFICIL,
  NivelDificultad.MUY_DIFICIL,
];

// Pesos del Índice de Desempeño del Estudiante (ID = w1·R + w2·C − w3·F − w4·V)
const W1 = 0.4;
const W2 = 0.3;
const W3 = 0.2;
const W4 = 0.1;
const A_MAX = 5;   // máximo de aciertos consecutivos para normalizar
const E_MAX = 5;   // máximo de errores consecutivos para normalizar
const T_MAX = 60;  // tiempo máximo en segundos para normalizar

@Injectable()
export class AdaptiveService {
  async evaluar(entrada: EntradaAdaptativa): Promise<DecisionAdaptativa> {
    const {
      nota,
      aciertosConsecutivos,
      erroresConsecutivos,
      tiempoPromedio,
      dificultadActual,
    } = entrada;

    // Calcular Índice de Desempeño
    const R = nota / 100;
    const C = Math.min(aciertosConsecutivos / A_MAX, 1);
    const F = Math.min(erroresConsecutivos / E_MAX, 1);
    const V = Math.min(tiempoPromedio / T_MAX, 1);
    const indiceDesempeno = Math.round((W1 * R + W2 * C - W3 * F - W4 * V) * 1000) / 1000;

    // Invocar JSONRulesEngine del adaptive-engine
    const decision = await motorEvaluar({
      nota,
      aciertosConsecutivos,
      erroresConsecutivos,
      tiempoPromedioRespuesta: tiempoPromedio,
      dificultadActual,
    });

    // Calcular dificultad siguiente según la acción
    const indice = ORDEN_DIFICULTAD.indexOf(dificultadActual);
    let dificultadSiguiente: NivelDificultad = dificultadActual;
    if (decision.accion === 'subir' && indice < ORDEN_DIFICULTAD.length - 1) {
      dificultadSiguiente = ORDEN_DIFICULTAD[indice + 1];
    } else if (decision.accion === 'bajar' && indice > 0) {
      dificultadSiguiente = ORDEN_DIFICULTAD[indice - 1];
    }

    return {
      accion: decision.accion as AccionAdaptativa,
      mensaje: decision.mensaje,
      indiceDesempeno,
      dificultadSiguiente,
    };
  }
}
