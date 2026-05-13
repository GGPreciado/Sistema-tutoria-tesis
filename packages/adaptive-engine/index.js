'use strict';

const { Engine } = require('json-rules-engine');

// Umbrales configurables para las decisiones adaptativas
const UMBRAL_SUBIR_NOTA = 80;
const UMBRAL_SUBIR_ACIERTOS = 3;
const UMBRAL_BAJAR_NOTA = 40;
const UMBRAL_BAJAR_ERRORES = 3;

// Reglas en orden de prioridad (mayor número = mayor prioridad)
const REGLAS = [
  {
    name: 'subir-dificultad',
    conditions: {
      all: [
        { fact: 'nota', operator: 'greaterThanInclusive', value: UMBRAL_SUBIR_NOTA },
        { fact: 'aciertosConsecutivos', operator: 'greaterThanInclusive', value: UMBRAL_SUBIR_ACIERTOS },
      ],
    },
    event: { type: 'subir' },
    priority: 10,
  },
  {
    name: 'bajar-dificultad',
    conditions: {
      any: [
        { fact: 'nota', operator: 'lessThan', value: UMBRAL_BAJAR_NOTA },
        { fact: 'erroresConsecutivos', operator: 'greaterThanInclusive', value: UMBRAL_BAJAR_ERRORES },
      ],
    },
    event: { type: 'bajar' },
    priority: 20, // mayor que subir: si el estudiante tiene errores consecutivos, bajar gana
  },
];

const MENSAJES = {
  subir: '¡Excelente trabajo! Avanzamos al siguiente nivel de dificultad.',
  bajar: 'Sigamos practicando en este nivel para afianzar lo aprendido.',
  mantener: 'Buen trabajo, continuemos practicando en este nivel.',
};

/**
 * Evalúa el contexto del estudiante y devuelve la decisión adaptativa.
 * Crea un Engine nuevo por llamada para evitar estado compartido entre ejecuciones.
 *
 * @param {import('./index').AdaptiveInput} input
 * @returns {Promise<import('./index').AdaptiveDecision>}
 */
async function evaluar(input) {
  const motor = new Engine(REGLAS, { allowUndefinedFacts: false });
  const { events } = await motor.run(input);

  const tiposDisparados = new Set(events.map((e) => e.type));

  // bajar tiene prioridad sobre subir ante cualquier conflicto
  if (tiposDisparados.has('bajar')) {
    return { accion: 'bajar', mensaje: MENSAJES.bajar };
  }
  if (tiposDisparados.has('subir')) {
    return { accion: 'subir', mensaje: MENSAJES.subir };
  }
  return { accion: 'mantener', mensaje: MENSAJES.mantener };
}

module.exports = { evaluar };
