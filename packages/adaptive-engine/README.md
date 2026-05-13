# @sistema-tutoria/adaptive-engine

Motor de reglas adaptativas para el Sistema de Tutoría. Decide si un estudiante debe subir, mantener o bajar de nivel de dificultad al finalizar una evaluación.

Implementado con [json-rules-engine](https://github.com/CacheControl/json-rules-engine).

## Qué hace

Recibe las métricas calculadas al terminar una evaluación y devuelve una decisión normalizada. El motor es **sin estado**: cada llamada a `evaluar()` crea un engine limpio, sin efectos secundarios entre evaluaciones.

## Formato del input (`AdaptiveInput`)

```typescript
interface AdaptiveInput {
  nota: number;                    // Puntaje 0–100
  aciertosConsecutivos: number;    // Racha actual de respuestas correctas
  erroresConsecutivos: number;     // Racha actual de respuestas incorrectas
  tiempoPromedioRespuesta: number; // Segundos promedio por pregunta
  dificultadActual: NivelDificultad;
}

type NivelDificultad = 'muy_facil' | 'facil' | 'normal' | 'dificil' | 'muy_dificil';
```

## Formato del output (`AdaptiveDecision`)

```typescript
interface AdaptiveDecision {
  accion: 'subir' | 'mantener' | 'bajar';
  mensaje: string; // Mensaje listo para mostrar al estudiante
}
```

## Reglas activas

| Regla | Condición | Decisión |
|-------|-----------|----------|
| Bajar dificultad | nota < 40 **ó** erroresConsecutivos ≥ 3 | `bajar` |
| Subir dificultad | nota ≥ 80 **y** aciertosConsecutivos ≥ 3 | `subir` |
| Mantener | ninguna de las anteriores aplica | `mantener` |

Cuando bajar y subir se disparan al mismo tiempo (caso de borde), **bajar tiene prioridad**.

## Ejemplo de uso

```javascript
const { evaluar } = require('@sistema-tutoria/adaptive-engine');

const decision = await evaluar({
  nota: 85,
  aciertosConsecutivos: 4,
  erroresConsecutivos: 0,
  tiempoPromedioRespuesta: 12,
  dificultadActual: 'normal',
});

console.log(decision);
// { accion: 'subir', mensaje: '¡Excelente trabajo! Avanzamos al siguiente nivel de dificultad.' }
```

## Uso desde el backend (módulo `adaptive`)

```typescript
import { evaluar, AdaptiveInput } from '@sistema-tutoria/adaptive-engine';

const input: AdaptiveInput = {
  nota: metricas.nota,
  aciertosConsecutivos: metricas.aciertosConsecutivos,
  erroresConsecutivos: metricas.erroresConsecutivos,
  tiempoPromedioRespuesta: metricas.tiempoPromedio,
  dificultadActual: estudiante.nivelActual,
};

const decision = await evaluar(input);
// decision.accion determina el nuevo nivel
```

## Extender las reglas

Las reglas están definidas en `index.js` como objetos planos. Para agregar una regla nueva (ej. bajar por tiempo de respuesta alto), agrega un objeto al array `REGLAS` siguiendo la sintaxis de `json-rules-engine`. El módulo `adaptive` del backend no necesita cambios.
