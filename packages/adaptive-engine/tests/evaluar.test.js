'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { evaluar } = require('../index.js');

describe('evaluar()', () => {
  it('devuelve subir cuando nota >= 80 y aciertosConsecutivos >= 3', async () => {
    const resultado = await evaluar({
      nota: 85,
      aciertosConsecutivos: 4,
      erroresConsecutivos: 0,
      tiempoPromedioRespuesta: 10,
      dificultadActual: 'normal',
    });
    assert.equal(resultado.accion, 'subir');
    assert.ok(resultado.mensaje.length > 0);
  });

  it('devuelve bajar cuando nota < 40', async () => {
    const resultado = await evaluar({
      nota: 35,
      aciertosConsecutivos: 0,
      erroresConsecutivos: 1,
      tiempoPromedioRespuesta: 45,
      dificultadActual: 'facil',
    });
    assert.equal(resultado.accion, 'bajar');
  });

  it('devuelve bajar cuando erroresConsecutivos >= 3', async () => {
    const resultado = await evaluar({
      nota: 60,
      aciertosConsecutivos: 0,
      erroresConsecutivos: 4,
      tiempoPromedioRespuesta: 20,
      dificultadActual: 'normal',
    });
    assert.equal(resultado.accion, 'bajar');
  });

  it('devuelve mantener para desempeño intermedio', async () => {
    const resultado = await evaluar({
      nota: 65,
      aciertosConsecutivos: 2,
      erroresConsecutivos: 1,
      tiempoPromedioRespuesta: 18,
      dificultadActual: 'normal',
    });
    assert.equal(resultado.accion, 'mantener');
  });

  it('bajar gana sobre subir en caso de conflicto', async () => {
    // nota alta pero errores consecutivos altos (caso de borde)
    const resultado = await evaluar({
      nota: 82,
      aciertosConsecutivos: 3,
      erroresConsecutivos: 3,
      tiempoPromedioRespuesta: 15,
      dificultadActual: 'dificil',
    });
    assert.equal(resultado.accion, 'bajar');
  });

  it('no sube si nota >= 80 pero aciertosConsecutivos < 3', async () => {
    const resultado = await evaluar({
      nota: 80,
      aciertosConsecutivos: 2,
      erroresConsecutivos: 0,
      tiempoPromedioRespuesta: 12,
      dificultadActual: 'facil',
    });
    assert.equal(resultado.accion, 'mantener');
  });
});
