-- =============================================================
-- Sistema Web de Tutoría Personalizada — Schema MVP (Fase 1)
-- =============================================================
-- Este archivo contiene el DDL completo de las 11 tablas del MVP.
-- Las tablas de Fase 2 (aulas, chatbot, padres, etc.) se agregarán
-- mediante migrations posteriores; ver docs/data-model.md.
--
-- Convenciones:
--   - Identificadores en snake_case y español.
--   - PKs uuid generadas con uuid-ossp para entidades de negocio
--     (usuarios, evaluaciones), serial para catálogos.
--   - Toda tabla tiene creado_en; las que se modifican incluyen
--     actualizado_en.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- ENUM TYPES
-- =============================================================

CREATE TYPE rol_usuario AS ENUM ('estudiante', 'tutor', 'padre', 'admin');
CREATE TYPE estado_usuario AS ENUM ('activo', 'suspendido');
CREATE TYPE tipo_pregunta AS ENUM ('diagnostica_curso', 'evaluacion_tema');
CREATE TYPE tipo_evaluacion AS ENUM ('diagnostica_curso', 'evaluacion_tema');
CREATE TYPE nivel_dificultad AS ENUM ('muy_facil', 'facil', 'normal', 'dificil', 'muy_dificil');
CREATE TYPE accion_adaptativa AS ENUM ('subir', 'mantener', 'bajar');

-- =============================================================
-- USUARIOS
-- Entidad central. En MVP solo se insertan filas con rol 'estudiante'.
-- =============================================================

CREATE TABLE usuarios (
    id              uuid            PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          varchar(120)    NOT NULL,
    codigo          varchar(40)     NOT NULL UNIQUE,
    password_hash   varchar(255)    NOT NULL,
    rol             rol_usuario     NOT NULL DEFAULT 'estudiante',
    estado          estado_usuario  NOT NULL DEFAULT 'activo',
    creado_en       timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX idx_usuarios_codigo ON usuarios (codigo);
CREATE INDEX idx_usuarios_rol ON usuarios (rol);

COMMENT ON TABLE usuarios IS 'Usuarios del sistema. En MVP solo estudiantes; en Fase 2 se agregan tutores, padres y admin.';
COMMENT ON COLUMN usuarios.codigo IS 'Identificador alfanumérico para login simple (ej. VAL001).';

-- =============================================================
-- CATÁLOGO ACADÉMICO: cursos, temas, preguntas, opciones
-- =============================================================

CREATE TABLE cursos (
    id          serial          PRIMARY KEY,
    nombre      varchar(100)    NOT NULL UNIQUE
);

COMMENT ON TABLE cursos IS 'Áreas académicas: Matemática, Comunicación, Ciencia y Tecnología.';

CREATE TABLE temas (
    id          serial          PRIMARY KEY,
    nombre      varchar(150)    NOT NULL,
    curso_id    int             NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    grado       int             NOT NULL CHECK (grado BETWEEN 1 AND 6)
);

CREATE INDEX idx_temas_curso ON temas (curso_id);
CREATE INDEX idx_temas_grado ON temas (grado);
CREATE UNIQUE INDEX idx_temas_curso_grado_nombre ON temas (curso_id, grado, nombre);

COMMENT ON TABLE temas IS 'Contenidos específicos asociados a un curso y un grado de primaria.';

CREATE TABLE preguntas (
    id              serial              PRIMARY KEY,
    enunciado       text                NOT NULL,
    tipo            tipo_pregunta       NOT NULL,
    curso_id        int                 REFERENCES cursos(id) ON DELETE CASCADE,
    tema_id         int                 REFERENCES temas(id) ON DELETE CASCADE,
    dificultad      nivel_dificultad    NOT NULL DEFAULT 'normal',
    -- Una pregunta debe estar asociada a un curso O a un tema (no a ambos vacíos).
    CONSTRAINT chk_preguntas_curso_o_tema CHECK (
        (tipo = 'diagnostica_curso' AND curso_id IS NOT NULL) OR
        (tipo = 'evaluacion_tema'   AND tema_id IS NOT NULL)
    )
);

CREATE INDEX idx_preguntas_tema ON preguntas (tema_id);
CREATE INDEX idx_preguntas_curso ON preguntas (curso_id);
CREATE INDEX idx_preguntas_dificultad ON preguntas (dificultad);

COMMENT ON COLUMN preguntas.dificultad IS 'Usado por el motor adaptativo para seleccionar preguntas según el nivel actual del estudiante.';

CREATE TABLE opciones (
    id              serial      PRIMARY KEY,
    pregunta_id     int         NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
    texto           text        NOT NULL,
    es_correcta     boolean     NOT NULL DEFAULT false
);

CREATE INDEX idx_opciones_pregunta ON opciones (pregunta_id);

-- =============================================================
-- EVALUACIONES Y RESULTADOS
-- =============================================================

CREATE TABLE evaluaciones (
    id              uuid                PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      uuid                NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo            tipo_evaluacion     NOT NULL,
    curso_id        int                 NOT NULL REFERENCES cursos(id),
    tema_id         int                 REFERENCES temas(id),
    grado           int                 NOT NULL CHECK (grado BETWEEN 1 AND 6),
    creado_en       timestamptz         NOT NULL DEFAULT now(),
    finalizado_en   timestamptz
);

CREATE INDEX idx_evaluaciones_usuario ON evaluaciones (usuario_id);
CREATE INDEX idx_evaluaciones_creado ON evaluaciones (creado_en);
CREATE INDEX idx_evaluaciones_finalizado ON evaluaciones (finalizado_en) WHERE finalizado_en IS NOT NULL;

COMMENT ON COLUMN evaluaciones.finalizado_en IS 'Null mientras la evaluación está en curso; se setea al invocar finalize.';

CREATE TABLE respuestas_evaluacion (
    id                      uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_id           uuid        NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
    pregunta_id             int         NOT NULL REFERENCES preguntas(id),
    opcion_id               int         NOT NULL REFERENCES opciones(id),
    es_correcta             boolean     NOT NULL,
    tiempo_respuesta_seg    int
);

CREATE INDEX idx_respuestas_evaluacion ON respuestas_evaluacion (evaluacion_id);

CREATE TABLE resultados_evaluacion (
    evaluacion_id                   uuid                PRIMARY KEY REFERENCES evaluaciones(id) ON DELETE CASCADE,
    nota                            int                 NOT NULL CHECK (nota BETWEEN 0 AND 100),
    puntaje_logro                   int                 NOT NULL DEFAULT 0,
    num_aciertos                    int                 NOT NULL DEFAULT 0,
    num_errores                     int                 NOT NULL DEFAULT 0,
    num_aciertos_consecutivos       int                 NOT NULL DEFAULT 0,
    num_errores_consecutivos        int                 NOT NULL DEFAULT 0,
    tiempo_promedio_respuesta       int                 NOT NULL DEFAULT 0,
    indice_desempeno                numeric(4,3),
    dificultad_actual               nivel_dificultad    NOT NULL,
    accion_adaptativa               accion_adaptativa   NOT NULL,
    mensaje_adaptativo              text
);

COMMENT ON COLUMN resultados_evaluacion.indice_desempeno IS 'Índice de Desempeño del Estudiante (ID) calculado por el algoritmo adaptativo. Rango 0.000 - 1.000.';
COMMENT ON COLUMN resultados_evaluacion.dificultad_actual IS 'Nivel de dificultad asignado al estudiante después de aplicar el motor adaptativo.';

-- =============================================================
-- GAMIFICACIÓN: puntos y logros
-- =============================================================

CREATE TABLE puntos_curso (
    id              uuid            PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      uuid            NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    curso_id        int             NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    puntos_total    int             NOT NULL DEFAULT 0,
    posicion        int,
    actualizado_en  timestamptz     NOT NULL DEFAULT now(),
    UNIQUE (usuario_id, curso_id)
);

CREATE INDEX idx_puntos_curso_curso ON puntos_curso (curso_id);
CREATE INDEX idx_puntos_curso_puntos ON puntos_curso (curso_id, puntos_total DESC);

COMMENT ON TABLE puntos_curso IS 'Acumulado de puntos por usuario por curso. La posición se recalcula tras cada evaluación.';

CREATE TABLE logros (
    id              uuid            PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          varchar(120)    NOT NULL,
    descripcion     text            NOT NULL,
    criterio        varchar(80)     NOT NULL UNIQUE,
    icono_url       text
);

COMMENT ON COLUMN logros.criterio IS 'Identificador legible del criterio (ej. examen_perfecto, racha_5). Usado en código para verificar desbloqueos.';

CREATE TABLE usuario_logros (
    usuario_id      uuid            NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    logro_id        uuid            NOT NULL REFERENCES logros(id) ON DELETE CASCADE,
    obtenido_en     timestamptz     NOT NULL DEFAULT now(),
    evaluacion_id   uuid            REFERENCES evaluaciones(id) ON DELETE SET NULL,
    PRIMARY KEY (usuario_id, logro_id)
);

CREATE INDEX idx_usuario_logros_usuario ON usuario_logros (usuario_id);

COMMENT ON COLUMN usuario_logros.evaluacion_id IS 'Evaluación que originó el desbloqueo del logro (cuando aplique).';

-- =============================================================
-- FIN
-- =============================================================
