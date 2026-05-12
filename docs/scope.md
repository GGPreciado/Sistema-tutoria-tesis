# Alcance del proyecto

## Fase 1 — MVP para validación

Lo único que debe estar funcional al iniciar la intervención experimental.

### Funcionalidad

- **Login simple del estudiante.** El investigador crea las cuentas previamente. El estudiante ingresa con código (o usuario) y contraseña. Sin registro público, sin recuperación de contraseña, sin JWT (basta con guardar `userId` en localStorage para esta fase).
- **Selección de curso, grado y tema.** El estudiante navega los contenidos disponibles.
- **Evaluación con preguntas de opción múltiple.** Presentación secuencial, registro de respuestas y de tiempo por pregunta.
- **Motor adaptativo.** Al finalizar cada evaluación, se calculan métricas (aciertos consecutivos, errores consecutivos, tiempo promedio) y se invoca el `adaptive-engine` (JSONRulesEngine) para obtener la decisión adaptativa: subir, mantener o bajar dificultad.
- **Visualización de resultados con retroalimentación.** Nota obtenida, mensaje del motor adaptativo, puntos ganados.
- **Gamificación básica.** Acumulación de puntos por curso y desbloqueo de logros simples (ej. "primer examen perfecto", "10 ejercicios resueltos").
- **Perfil del estudiante.** Vista simple con nombre, puntos totales, logros desbloqueados, nivel actual por curso.
- **Endpoint de exportación de datos.** `GET /admin/export` que devuelve un CSV con todas las evaluaciones del periodo, listo para análisis con paired t-test.

### Salidas esperadas para la tesis

El sistema debe garantizar que, al finalizar la intervención, se puedan exportar:

- Por estudiante: identificador, todas las evaluaciones rendidas con fecha, nota, métricas (aciertos, errores, tiempo), nivel de dificultad alcanzado.
- Total de ejercicios resueltos, total de puntos, logros desbloqueados.

## Fase 2 — Diferido (post-validación)

No implementar todavía, pero la arquitectura debe permitir agregar estas funcionalidades sin reestructuración.

### Sprint 2 de la tesis: Gestión académica y tutoría virtual
- Aulas virtuales creadas por tutores
- Carga y asignación de ejercicios por parte del tutor
- Panel de monitoreo del rendimiento por parte del tutor
- Chat interno del aula
- Reuniones virtuales

### Sprint 3 de la tesis: Interacción y comunidad educativa
- Asistente virtual tipo chatbot (integración con API de Claude) para guiar al estudiante a través de la aplicación, explicar el flujo entre pantallas y orientar la navegación
- Perfil personalizado del estudiante (curso favorito, descripción, foto)
- Interacción entre estudiantes dentro del aula

### Sprint 4 de la tesis: Gestión de usuarios y acceso (versión completa)
- Registro público de usuarios
- Autenticación con JWT
- Recuperación de contraseña por correo
- Edición avanzada de datos personales

### Sprint 5 de la tesis: Supervisión familiar y administración
- Vinculación de cuenta del padre con la del estudiante
- Reportes de progreso enviados por correo
- Panel de administración de usuarios
- Revisión y aprobación de contenido subido por tutores

## Justificación del recorte

El paired t-test se basa exclusivamente en la comparación pretest–postest de un mismo salón. Las pruebas pretest y postest son instrumentos escritos externos al sistema. Por lo tanto, durante la intervención el sistema solo necesita ofrecer al estudiante el ciclo de evaluación adaptativa con gamificación, y registrar de forma precisa los datos de uso. Todo lo demás puede agregarse después sin afectar la validación.
