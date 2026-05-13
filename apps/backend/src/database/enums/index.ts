export enum RolUsuario {
  ESTUDIANTE = 'estudiante',
  TUTOR = 'tutor',
  PADRE = 'padre',
  ADMIN = 'admin',
}

export enum EstadoUsuario {
  ACTIVO = 'activo',
  SUSPENDIDO = 'suspendido',
}

export enum TipoPregunta {
  DIAGNOSTICA_CURSO = 'diagnostica_curso',
  EVALUACION_TEMA = 'evaluacion_tema',
}

export enum TipoEvaluacion {
  DIAGNOSTICA_CURSO = 'diagnostica_curso',
  EVALUACION_TEMA = 'evaluacion_tema',
}

export enum NivelDificultad {
  MUY_FACIL = 'muy_facil',
  FACIL = 'facil',
  NORMAL = 'normal',
  DIFICIL = 'dificil',
  MUY_DIFICIL = 'muy_dificil',
}

export enum AccionAdaptativa {
  SUBIR = 'subir',
  MANTENER = 'mantener',
  BAJAR = 'bajar',
}
