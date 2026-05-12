# Contrato de API — MVP

Especificación completa de los endpoints del backend NestJS para la Fase 1 del sistema. Esta API es la fuente de verdad para el contrato entre frontend y backend; cualquier divergencia se resuelve aquí.

## Convenciones generales

**Base URL:** `http://localhost:3000` en desarrollo. La URL definitiva se configura por variable de entorno.

**Formato:** Todas las requests y responses son `application/json` salvo `/admin/export` que devuelve `text/csv`.

**Autenticación (MVP):** Endpoints protegidos requieren el header `X-User-Id: <uuid>` que el frontend obtiene tras un login exitoso y guarda en localStorage. Esta autenticación es deliberadamente simple para el MVP. Cuando se implemente JWT en Fase 2, los consumidores no deben requerir cambios — el `AuthGuard` se actualiza internamente para validar el token y poblar `req.user`.

**Rol-based:** El endpoint `/admin/export` adicionalmente requiere `X-Admin-Token: <secret>` cuyo valor se configura por variable de entorno (`ADMIN_EXPORT_TOKEN`). Esto evita que cualquier estudiante autenticado pueda descargar los datos del experimento.

**Errores:** Formato uniforme:

```json
{
  "statusCode": 400,
  "mensaje": "Descripción legible del error",
  "error": "BadRequest"
}
```

Códigos esperados: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`.

**Validación:** Todos los endpoints validan body y params con `class-validator`. Los errores de validación devuelven `400` con detalle de los campos inválidos.

---

## Health

### `GET /health`

Sin autenticación. Sirve para liveness probe.

**Response 200:**
```json
{ "status": "ok" }
```

---

## Autenticación

### `POST /auth/login`

Login simple por código y contraseña.

**Request:**
```json
{
  "codigo": "VAL001",
  "password": "pass1234"
}
```

**Response 200:**
```json
{
  "usuario": {
    "id": "0c9d…uuid…",
    "nombre": "Valeria Torres Rojas",
    "codigo": "VAL001",
    "rol": "estudiante"
  }
}
```

**Response 401:**
```json
{ "statusCode": 401, "mensaje": "Credenciales inválidas", "error": "Unauthorized" }
```

El frontend guarda `usuario.id` en localStorage como `userId` y lo envía en todos los requests subsiguientes vía header `X-User-Id`.

---

## Estudiantes

### `GET /students/me`

Devuelve el perfil del estudiante autenticado, con sus puntos por curso y logros desbloqueados. Equivalente a la pantalla de perfil (Figura 17 de la tesis).

**Headers:** `X-User-Id` requerido.

**Response 200:**
```json
{
  "id": "0c9d…uuid…",
  "nombre": "Valeria Torres Rojas",
  "codigo": "VAL001",
  "puntosTotal": 245,
  "puntosPorCurso": [
    {
      "cursoId": 1,
      "cursoNombre": "Matemática",
      "puntosTotal": 245,
      "posicion": 3
    }
  ],
  "logros": [
    {
      "id": "uuid…",
      "nombre": "Examen perfecto",
      "descripcion": "Obtuviste todas las respuestas correctas en una evaluación.",
      "iconoUrl": null,
      "obtenidoEn": "2026-05-12T14:30:00Z"
    }
  ]
}
```

---

## Catálogo académico

### `GET /courses`

Lista los cursos disponibles.

**Headers:** `X-User-Id` requerido.

**Response 200:**
```json
[
  { "id": 1, "nombre": "Matemática" }
]
```

### `GET /courses/:cursoId/topics`

Lista los temas de un curso, agrupables por grado.

**Headers:** `X-User-Id` requerido.

**Path params:** `cursoId` (int)

**Response 200:**
```json
[
  { "id": 1, "nombre": "Fracciones equivalentes",     "grado": 4 },
  { "id": 2, "nombre": "Multiplicación de naturales", "grado": 4 },
  { "id": 3, "nombre": "Suma y resta de fracciones",  "grado": 5 },
  { "id": 4, "nombre": "Operaciones con decimales",   "grado": 5 }
]
```

**Response 404:** si el curso no existe.

---

## Evaluaciones

### `POST /evaluations`

Inicia una nueva evaluación para un tema. El backend selecciona un conjunto de preguntas según la dificultad actual del estudiante en ese tema (consultando la última `resultados_evaluacion.dificultad_actual` del usuario para ese tema, o `normal` si es la primera vez). En el MVP se devuelven 8 preguntas centradas en el nivel actual con variación de ±1 nivel para permitir al motor adaptativo medir progresión.

**Headers:** `X-User-Id` requerido.

**Request:**
```json
{ "temaId": 1 }
```

**Response 201:**
```json
{
  "evaluacionId": "uuid…",
  "temaId": 1,
  "temaNombre": "Fracciones equivalentes",
  "preguntas": [
    {
      "id": 5,
      "enunciado": "Si multiplico 1/3 por 2/2, obtengo:",
      "opciones": [
        { "id": 17, "texto": "2/6" },
        { "id": 18, "texto": "1/6" },
        { "id": 19, "texto": "2/3" },
        { "id": 20, "texto": "1/2" }
      ]
    }
  ]
}
```

**Importante:** Las opciones devueltas **no** incluyen `es_correcta`. Esa información solo existe en la base de datos y se usa al finalizar la evaluación.

### `POST /evaluations/:evaluacionId/finalize`

Recibe todas las respuestas del estudiante, calcula métricas, invoca el motor adaptativo, asigna puntos y verifica logros desbloqueados.

**Headers:** `X-User-Id` requerido. El backend valida que la evaluación pertenezca a este usuario.

**Path params:** `evaluacionId` (uuid)

**Request:**
```json
{
  "respuestas": [
    { "preguntaId": 5,  "opcionId": 17, "tiempoRespuestaSeg": 22 },
    { "preguntaId": 7,  "opcionId": 24, "tiempoRespuestaSeg": 35 },
    { "preguntaId": 8,  "opcionId": 28, "tiempoRespuestaSeg": 18 }
  ]
}
```

**Response 200:**
```json
{
  "nota": 85,
  "numAciertos": 8,
  "numErrores": 2,
  "numAciertosConsecutivos": 5,
  "numErroresConsecutivos": 1,
  "tiempoPromedioRespuesta": 28,
  "indiceDesempeno": 0.72,
  "dificultadActual": "dificil",
  "accionAdaptativa": "subir",
  "mensajeAdaptativo": "¡Excelente trabajo! Te propondremos ejercicios más desafiantes.",
  "puntosGanados": 100,
  "logrosDesbloqueados": [
    {
      "id": "uuid…",
      "nombre": "Racha de 5",
      "descripcion": "Lograste 5 respuestas correctas seguidas en una evaluación."
    }
  ],
  "rankingActualizado": {
    "cursoId": 1,
    "puntosTotal": 245,
    "posicion": 3
  }
}
```

**Response 409:** si la evaluación ya fue finalizada anteriormente.

**Response 403:** si la evaluación no pertenece al usuario autenticado.

---

## Exportación de datos (uso del investigador)

### `GET /admin/export`

Devuelve un CSV con todas las evaluaciones finalizadas de todos los usuarios. Insumo para el análisis estadístico con paired t-test.

**Headers:**
- `X-User-Id` requerido (cualquier usuario autenticado puede acceder en MVP).
- `X-Admin-Token` requerido (debe coincidir con la variable de entorno `ADMIN_EXPORT_TOKEN`).

**Query params (opcionales):**
- `desde` (ISO date): filtra evaluaciones a partir de esta fecha.
- `hasta` (ISO date): filtra evaluaciones hasta esta fecha.

**Response 200:** `text/csv` con cabecera y una fila por evaluación finalizada.

```csv
usuario_id,usuario_codigo,usuario_nombre,evaluacion_id,curso,tema,grado,creado_en,finalizado_en,nota,num_aciertos,num_errores,num_aciertos_consecutivos,num_errores_consecutivos,tiempo_promedio_respuesta,indice_desempeno,dificultad_actual,accion_adaptativa,puntaje_logro
0c9d…,VAL001,Valeria Torres Rojas,uuid…,Matemática,Fracciones equivalentes,4,2026-05-12T14:00:00Z,2026-05-12T14:08:00Z,85,8,2,5,1,28,0.720,dificil,subir,100
```

**Response 403:** si `X-Admin-Token` es inválido o ausente.

---

## Notas para el frontend

1. **Persistencia de sesión:** Tras `POST /auth/login`, guardar `usuario.id` en `localStorage` con clave `userId`. Un interceptor HTTP debe leerlo y agregarlo como `X-User-Id` a cada request automáticamente.

2. **Logout:** Simplemente borrar `localStorage.userId` y redirigir a `/login`. No hay endpoint backend para logout en MVP.

3. **Manejo de 401:** Si cualquier endpoint devuelve `401`, el frontend debe limpiar `localStorage` y redirigir al login.

4. **Flujo de evaluación recomendado:**
   1. Usuario en pantalla de selección de tema → click en un tema.
   2. Frontend hace `POST /evaluations` con `temaId`.
   3. Frontend renderiza las preguntas devueltas en una sola pantalla (todas a la vez, como en Figura 15 de la tesis).
   4. Frontend mide tiempo desde el render hasta el click final en "Finalizar evaluación".
   5. Para `tiempoRespuestaSeg` por pregunta, el MVP puede simplificar y enviar el tiempo total dividido entre el número de preguntas, o registrar el tiempo en cada cambio de selección. Elegir el approach que sea más simple sin sacrificar fidelidad.
   6. Frontend hace `POST /evaluations/:id/finalize` con todas las respuestas.
   7. Frontend renderiza la pantalla de resultados con la response (similar a Figura 16 de la tesis).
