# Modelo de datos

## Principio: nombrar para el futuro

Aunque el MVP solo usa estudiantes, el modelo se diseña con `usuarios` como entidad central y un campo `rol` desde el inicio. Esto evita una migración costosa al introducir tutores, padres y administradores en Fase 2.

## Tablas del MVP (Fase 1)

### usuarios
Entidad central. En MVP solo se insertan filas con rol `estudiante`.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| nombre | varchar | |
| codigo | varchar UNIQUE | identificador alfanumérico, login simple |
| password_hash | varchar | bcrypt |
| rol | enum | `estudiante \| tutor \| padre \| admin` |
| estado | enum | `activo \| suspendido`. Default: activo |
| creado_en | timestamp | |

### cursos
| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| nombre | varchar | "Matemática", "Comunicación", etc. |

### temas
| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| nombre | varchar | |
| curso_id | int FK → cursos.id | |
| grado | int | 1 a 6 (primaria) |

### preguntas
| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| enunciado | text | |
| tipo | enum | `diagnostica_curso \| evaluacion_tema` |
| curso_id | int FK | nullable; usado para diagnósticas |
| tema_id | int FK | nullable; usado para evaluaciones por tema |
| dificultad | enum | `muy_facil \| facil \| normal \| dificil \| muy_dificil` |

### opciones
| Columna | Tipo | Notas |
|---------|------|-------|
| id | serial PK | |
| pregunta_id | int FK | |
| texto | text | |
| es_correcta | boolean | |

### evaluaciones
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| usuario_id | uuid FK → usuarios.id | |
| tipo | enum | `diagnostica_curso \| evaluacion_tema` |
| curso_id | int FK | |
| tema_id | int FK | nullable |
| grado | int | |
| creado_en | timestamp | |
| finalizado_en | timestamp | nullable hasta que se cierra |

### respuestas_evaluacion
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| evaluacion_id | uuid FK | |
| pregunta_id | int FK | |
| opcion_id | int FK | |
| es_correcta | boolean | |
| tiempo_respuesta_seg | int | |

### resultados_evaluacion
Una fila por evaluación finalizada.

| Columna | Tipo | Notas |
|---------|------|-------|
| evaluacion_id | uuid PK FK | |
| nota | int | escala 0–100 |
| puntaje_logro | int | puntos otorgados al estudiante |
| num_aciertos | int | |
| num_errores | int | |
| num_aciertos_consecutivos | int | |
| num_errores_consecutivos | int | |
| tiempo_promedio_respuesta | int | segundos |
| dificultad_actual | varchar | nivel asignado tras aplicar el motor adaptativo |
| accion_adaptativa | varchar | resultado del motor: `subir \| mantener \| bajar` |

### puntos_curso
Puntos acumulados por estudiante por curso. Reemplaza al `ranking_curso` original con un nombre más general.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| usuario_id | uuid FK | |
| curso_id | int FK | |
| puntos_total | int | |
| posicion | int | nullable; calcular en query si la muestra es chica |
| actualizado_en | timestamp | |

### logros
Catálogo de logros disponibles.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| nombre | varchar | |
| descripcion | text | |
| criterio | varchar | identificador legible: `examen_perfecto`, `grado5_alcanzado`, etc. |
| icono_url | text | nullable |

### usuario_logros
Relación N:M entre usuarios y logros desbloqueados.

| Columna | Tipo | Notas |
|---------|------|-------|
| usuario_id | uuid FK PK | |
| logro_id | uuid FK PK | |
| obtenido_en | timestamp | |
| evaluacion_id | uuid FK | nullable, si el logro se originó en una evaluación |

## Tablas de Fase 2 (no crear ahora)

Quedan documentadas para que el modelo evolucione coherentemente. **No incluir en las migrations iniciales.** Se agregan cuando la funcionalidad correspondiente entre en desarrollo.

- `aulas`, `miembros_aula` — aulas virtuales del Sprint 2
- `ejercicios_tutor`, `asignaciones`, `resultados_asignacion` — gestión de contenidos por tutor
- `mensajes_aula` — chat del aula
- `historial_chatbot` — interacciones con el asistente virtual
- `perfil_estudiante` — extensión opcional con descripción y foto
- `tokens_recuperacion`, `sesiones` — autenticación robusta del Sprint 4
- `vinculos_padre_estudiante`, `reportes_progreso` — supervisión familiar
- `registros_auditoria`, `solicitudes_publicacion_contenido` — administración

## Seeds para desarrollo

Los seeds iniciales deben crear:

- 5 estudiantes de prueba (usuarios con rol `estudiante`).
- 1 curso (Matemática) con al menos 2 temas (uno para 4to grado y otro para 5to).
- 20 preguntas distribuidas entre los temas, con sus opciones.
- 5 logros básicos en el catálogo.

Esto permite probar el flujo completo sin crear datos manualmente.
