// Stub del motor adaptativo.
// El código real del JSONRulesEngine se migra aquí en el Paso 1 del sprint-mvp.md.
// Ver docs/architecture.md — sección "El módulo adaptive".

/**
 * @param {import('./index').AdaptiveInput} input
 * @returns {Promise<import('./index').AdaptiveDecision>}
 */
async function evaluar(input) {
  throw new Error(
    'AdaptiveEngine no implementado. Migrar JSONRulesEngine en el Paso 1.',
  );
}

module.exports = { evaluar };
