# Plan de implementación del MVP — prompts secuenciales

Este documento contiene 12 prompts ordenados que se ejecutan en sesiones separadas de Claude Code. Cada prompt es autocontenido: copia, pega, ejecuta, verifica antes de pasar al siguiente.

## Cómo usar este documento

1. Antes del primer prompt, asegúrate de haber ejecutado el **prompt bootstrap** (ver mensaje del chat) que crea el monorepo vacío. Este documento empieza desde ahí.
2. Cada paso es **una conversación de Claude Code**. Al terminar un paso, cierra la conversación y abre una nueva para el siguiente. Esto mantiene el contexto limpio y predecible.
3. Si un paso falla o produce algo inesperado, **no avances**. Pídele a Claude Code que corrija dentro de la misma conversación antes de pasar al siguiente.
4. Después de cada paso hay una sección **Verificación** con comandos concretos para confirmar que todo quedó funcionando.
5. Los archivos `CLAUDE.md`, `docs/scope.md`, `docs/data-model.md`, `docs/architecture.md`, `docs/database-schema.sql`, `docs/seeds-data.json` y `docs/api-contract.md` deben estar presentes en el repo antes de empezar.

---

## Paso 1 — Migración del adaptive-engine

```
Lee CLAUDE.md y docs/architecture.md.

Tengo un repositorio existente con el JSONRulesEngine implementado, ubicado en
`[RUTA_ABSOLUTA_AL_REPO_DEL_JSONRULES]`. Necesito que lo migres al paquete
packages/adaptive-engine de este monorepo.

Tareas:
1. Analiza primero la estructura del repo de origen y reporta qué archivos
   tiene, cuál es su entry point, qué dependencias usa y cómo se invoca.
2. Copia los archivos relevantes a packages/adaptive-engine. No reescribas
   la lógica.
3. Adapta el package.json para que sea consumible desde el workspace:
   nombre debe ser "@sistema-tutoria/adaptive-engine", main apuntando al
   archivo correcto, y types si aplica.
4. Si el código original no está en TypeScript, no lo conviertas; envuelvelo
   con tipos en un archivo index.d.ts adicional. Si ya es TypeScript,
   asegúrate que compile.
5. Crea un README.md en packages/adaptive-engine documentando:
   - Qué hace el motor.
   - Formato del input (contexto del estudiante).
   - Formato del output (decisión adaptativa).
   - Ejemplo de uso.
6. Agrega el paquete como dependencia en apps/backend/package.json usando
   el sintaxis de workspace ("workspace:*").

NO toques nada fuera de packages/adaptive-engine y apps/backend/package.json.
```

**Verificación:**
```bash
cd packages/adaptive-engine && npm run build  # o similar según su estructura
cd ../../apps/backend && pnpm install
```
- El paquete debe compilar/empaquetar sin errores.
- `apps/backend/node_modules/@sistema-tutoria/adaptive-engine` debe existir como symlink.

---

## Paso 2 — Schema de base de datos (migrations TypeORM)

```
Lee docs/data-model.md y docs/database-schema.sql.

Convierte el schema definido en docs/database-schema.sql en migrations de
TypeORM dentro de apps/backend.

Tareas:
1. Configura TypeORM en apps/backend (si no está configurado ya):
   - DataSource con conexión vía variables de entorno.
   - Carpeta de migrations en apps/backend/src/database/migrations.
   - Carpeta de entities en apps/backend/src/database/entities.
   - Scripts en package.json: migration:generate, migration:run,
     migration:revert.
2. Crea las entidades TypeORM correspondientes a las 11 tablas del MVP:
   usuarios, cursos, temas, preguntas, opciones, evaluaciones,
   respuestas_evaluacion, resultados_evaluacion, puntos_curso, logros,
   usuario_logros.
   - Sigue exactamente los nombres de columnas y tipos de
     docs/database-schema.sql.
   - Usa enums de TypeScript que reflejen los enum types de PostgreSQL.
   - Define las relaciones entre entidades (OneToMany, ManyToOne, etc.).
3. Genera UNA migration inicial llamada "Initial1MVP" que cree todas las
   tablas, tipos enum, índices y constraints.
4. Verifica que la migration corra contra la base de datos del docker-compose.

NO crees aún los módulos de NestJS (auth, evaluations, etc.). Solo el schema
y las entities.

Al terminar, muéstrame la estructura final de apps/backend/src/database/.
```

**Verificación:**
```bash
docker-compose up -d
pnpm --filter backend migration:run
docker exec -it <postgres_container> psql -U postgres -d tutoria -c "\dt"
```
- Deben aparecer las 11 tablas.
- `\dT` debe listar los enum types creados.

---

## Paso 3 — Seeds de datos de prueba

```
Lee docs/seeds-data.json.

Implementa el sistema de seeds en apps/backend.

Tareas:
1. Crea un script en apps/backend/src/database/seeds/seed.ts que:
   - Lea docs/seeds-data.json.
   - Hashee las passwords con bcrypt (10 rounds) antes de insertar usuarios.
   - Resuelva los identificadores locales (id_local, curso_local,
     tema_local) para producir las foreign keys reales.
   - Inserte los datos en orden de dependencias: cursos → temas → preguntas
     → opciones → usuarios → logros.
   - Sea idempotente: usar ON CONFLICT DO NOTHING o equivalente, de modo
     que se pueda re-ejecutar sin duplicar.
2. Agrega un script "seed:run" en apps/backend/package.json que ejecute
   el seeder.
3. Ejecuta el seed contra la base de datos local y verifica que los datos
   se insertaron correctamente.

NO crees datos sintéticos adicionales. Usa exactamente lo que está en
docs/seeds-data.json.

Al terminar, muéstrame:
- El conteo de filas en cada tabla.
- Un usuario de prueba con su password hasheada (solo para confirmar que
  bcrypt funcionó).
```

**Verificación:**
```bash
pnpm --filter backend seed:run
docker exec -it <postgres_container> psql -U postgres -d tutoria -c \
  "SELECT count(*) FROM usuarios; SELECT count(*) FROM preguntas; SELECT count(*) FROM logros;"
```
- usuarios: 5, preguntas: 30, logros: 8.

---

## Paso 4 — Backend: infraestructura común y autenticación

```
Lee docs/architecture.md y la sección de Autenticación de docs/api-contract.md.

Implementa la infraestructura común y el módulo de autenticación.

Tareas:
1. Crea apps/backend/src/common/ con:
   - guards/auth.guard.ts: lee el header X-User-Id, valida que el usuario
     exista en BD y esté activo, y popula req.user con el objeto usuario.
     Si falta o es inválido, lanza UnauthorizedException.
   - decorators/current-user.decorator.ts: extrae req.user del contexto.
   - filters/http-exception.filter.ts: formatea los errores como define
     docs/api-contract.md.
2. Crea apps/backend/src/modules/auth/ con:
   - auth.module.ts
   - auth.controller.ts con POST /auth/login.
   - auth.service.ts con un método login(codigo, password) que verifica
     la password con bcrypt y devuelve el usuario.
   - dto/login.dto.ts con validación class-validator.
3. Crea apps/backend/src/modules/users/ con:
   - users.module.ts
   - users.controller.ts con GET /students/me (protegido por AuthGuard).
   - users.service.ts con métodos para obtener perfil completo (puntos
     por curso + logros desbloqueados).
4. Configura el AuthGuard como global o aplicalo selectivamente en cada
   controller que lo necesite. Recomiendo aplicarlo selectivamente con
   @UseGuards(AuthGuard) y exceptuar /auth/login y /health.
5. Asegúrate que el HttpExceptionFilter esté registrado globalmente.

Después implementa pruebas de los endpoints con supertest:
- POST /auth/login con credenciales correctas → 200 con usuario.
- POST /auth/login con credenciales incorrectas → 401.
- GET /students/me sin header X-User-Id → 401.
- GET /students/me con X-User-Id válido → 200 con perfil.

Al terminar, levanta el backend y muestra los resultados de los tests.
```

**Verificación:**
```bash
pnpm --filter backend dev
# en otra terminal:
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"codigo":"VAL001","password":"pass1234"}'
# debe devolver { "usuario": { ... } }

curl http://localhost:3000/students/me -H "X-User-Id: <uuid_de_la_response_anterior>"
# debe devolver el perfil
```

---

## Paso 5 — Backend: catálogo (cursos, temas, preguntas)

```
Lee la sección de Catálogo académico en docs/api-contract.md.

Implementa el módulo courses con endpoints de lectura.

Tareas:
1. Crea apps/backend/src/modules/courses/ con:
   - courses.module.ts
   - courses.controller.ts con:
     - GET /courses
     - GET /courses/:cursoId/topics
   - courses.service.ts con la lógica de consulta a las entidades cursos
     y temas.
2. Ambos endpoints están protegidos por AuthGuard.
3. Define DTOs de respuesta tipados que excluyan información interna
   (no devolver id_local, no devolver es_correcta de opciones, etc.).
4. Si el cursoId no existe en GET /courses/:cursoId/topics, devolver 404.

Tests con supertest:
- GET /courses sin auth → 401.
- GET /courses con auth → 200 con array.
- GET /courses/1/topics → 200 con 4 temas.
- GET /courses/999/topics → 404.

Al terminar, muestra los resultados de los tests y un ejemplo de response
real obtenida con curl.
```

**Verificación:**
```bash
curl http://localhost:3000/courses -H "X-User-Id: <uuid>"
curl http://localhost:3000/courses/1/topics -H "X-User-Id: <uuid>"
```

---

## Paso 6 — Backend: evaluaciones y motor adaptativo

```
Lee la sección Evaluaciones de docs/api-contract.md, las páginas relevantes
de docs/data-model.md, y CLAUDE.md sobre el módulo adaptive.

Este es el paso crítico del MVP. Implementa los módulos evaluations y
adaptive.

Tareas:

A. Módulo adaptive (apps/backend/src/modules/adaptive/):
   1. AdaptiveService con un método evaluar(input) → DecisionAdaptativa.
   2. El input recibe: nota (0-100), aciertosConsecutivos, erroresConsecutivos,
      tiempoPromedio, dificultadActual.
   3. El service:
      a. Construye el contexto en el formato que espera @sistema-tutoria/adaptive-engine.
      b. Invoca el JSONRulesEngine.
      c. Adicionalmente, calcula el Índice de Desempeño del Estudiante (ID)
         usando el algoritmo descrito en CLAUDE.md y la tesis:
         - R = nota / 100
         - C = min(aciertosConsecutivos / 5, 1)   (Amax = 5)
         - F = min(erroresConsecutivos / 5, 1)    (Emax = 5)
         - V = min(tiempoPromedio / 60, 1)        (Tmax = 60s)
         - ID = 0.4*R + 0.3*C - 0.2*F - 0.1*V
         (los pesos w1..w4 son configurables; usa estos valores por defecto)
      d. Devuelve { accion: 'subir'|'mantener'|'bajar', mensaje: string,
         indiceDesempeno: number, dificultadSiguiente: NivelDificultad }.
      e. La transición de dificultad sigue: muy_facil → facil → normal → dificil → muy_dificil.
         Si la accion es 'subir' y ya está en muy_dificil, mantener.
         Si la accion es 'bajar' y ya está en muy_facil, mantener.

B. Módulo evaluations (apps/backend/src/modules/evaluations/):
   1. POST /evaluations:
      - Recibe { temaId }.
      - Determina la dificultadActual del usuario para ese tema:
        consultar el último resultados_evaluacion del usuario en ese tema;
        si no existe, default a 'normal'.
      - Selecciona 8 preguntas del tema con dificultad cercana al nivel actual
        (mezcla: 5 al nivel actual, 2 un nivel arriba si hay, 1 un nivel abajo
        si hay; rellena con cualquier dificultad si faltan).
      - Crea la evaluación en BD (estado: no finalizada).
      - Devuelve evaluacionId + preguntas (sin es_correcta en las opciones).
   2. POST /evaluations/:evaluacionId/finalize:
      - Valida que la evaluación pertenezca al usuario autenticado (403 si no).
      - Valida que la evaluación no esté finalizada (409 si lo está).
      - Para cada respuesta del body, busca la opción correspondiente y
        determina si es correcta.
      - Inserta filas en respuestas_evaluacion.
      - Calcula métricas:
        * numAciertos, numErrores
        * numAciertosConsecutivos: la racha más larga de aciertos seguidos.
        * numErroresConsecutivos: la racha más larga de errores seguidos.
        * tiempoPromedioRespuesta: promedio de tiempoRespuestaSeg.
        * nota: (numAciertos / total) * 100.
      - Llama a AdaptiveService.evaluar() con esas métricas.
      - Inserta resultados_evaluacion con todo (incluyendo dificultad_actual,
        accion_adaptativa, mensaje_adaptativo, indice_desempeno).
      - Marca la evaluación como finalizada (finalizado_en = now).
      - Calcula puntaje_logro: 100 puntos por examen perfecto, 50 por nota >= 80,
        25 por nota >= 60, 10 por nota >= 40, 0 si menor.
      - El módulo gamification (siguiente paso) se encargará de actualizar
        puntos_curso y verificar logros. POR AHORA deja un TODO comentado
        donde habría que invocar GamificationService.

Tests con supertest:
- POST /evaluations con temaId válido → 201 con preguntas.
- POST /evaluations/:id/finalize con respuestas correctas → 200 con resultado.
- Verifica que el resultado tenga indiceDesempeno calculado, accionAdaptativa
  válida y dificultadActual asignada.
- POST /evaluations/:id/finalize dos veces → segundo intento devuelve 409.

Al terminar, muestra:
- Output de los tests.
- Un ejemplo de evaluación end-to-end ejecutada con curl: iniciar evaluación,
  enviar respuestas, recibir resultado.
```

**Verificación manual:**
```bash
# Iniciar evaluación
curl -X POST http://localhost:3000/evaluations \
  -H "X-User-Id: <uuid>" -H "Content-Type: application/json" \
  -d '{"temaId":1}'

# Tomar las preguntas y opciones, simular respuestas, finalizar
curl -X POST http://localhost:3000/evaluations/<eval_id>/finalize \
  -H "X-User-Id: <uuid>" -H "Content-Type: application/json" \
  -d '{"respuestas":[...]}'
```

---

## Paso 7 — Backend: gamificación

```
Lee la tabla logros de docs/seeds-data.json y la sección de gamificación
en CLAUDE.md.

Implementa el módulo gamification.

Tareas:
1. Crea apps/backend/src/modules/gamification/:
   - gamification.module.ts
   - gamification.service.ts con dos métodos públicos:
     a. asignarPuntos(usuarioId, cursoId, puntos): suma puntos a la fila
        correspondiente de puntos_curso (crea si no existe), recalcula
        posicion del usuario en ese curso.
     b. verificarLogros(usuarioId, evaluacionId, contexto): evalúa si
        alguno de los 8 logros del catálogo se desbloquea con la evaluación
        recién finalizada y, si corresponde, inserta filas en usuario_logros.
        Devuelve la lista de logros recién desbloqueados.
   
2. Reglas de desbloqueo de logros (criterios definidos en seeds-data.json):
   - primer_examen: usuario completa su primera evaluación.
   - examen_perfecto: nota === 100.
   - velocista: tiempoPromedioRespuesta < 20.
   - racha_5: numAciertosConsecutivos >= 5.
   - racha_10: numAciertosConsecutivos >= 10.
   - nivel_avanzado: dificultadActual === 'dificil' o 'muy_dificil'.
   - constancia_5: usuario tiene 5+ evaluaciones finalizadas en total.
   - dedicado_10: usuario tiene 10+ evaluaciones finalizadas en total.
   
   Antes de insertar, verificar que el logro no esté ya desbloqueado (no
   duplicar en usuario_logros).

3. En el módulo evaluations, en el flujo finalize, después de insertar
   resultados_evaluacion:
   - Llamar a gamificationService.asignarPuntos().
   - Llamar a gamificationService.verificarLogros().
   - Incluir en la response del endpoint los campos puntosGanados,
     logrosDesbloqueados y rankingActualizado, según docs/api-contract.md.

Tests:
- Usuario completa primera evaluación con nota 100 → desbloquea
  primer_examen Y examen_perfecto.
- Usuario completa segunda evaluación → NO se vuelve a desbloquear
  primer_examen.
- Usuario con racha de 5 aciertos → desbloquea racha_5.

Al terminar, muestra el output de los tests y una ejecución end-to-end
donde se vea el ranking actualizado y al menos un logro desbloqueado.
```

**Verificación:**
- Una evaluación finalizada debe devolver `puntosGanados` y, si aplica,
  `logrosDesbloqueados`.
- `GET /students/me` debe reflejar los nuevos puntos y logros.

---

## Paso 8 — Backend: exportación de datos

```
Lee la sección de Exportación de docs/api-contract.md.

Implementa el módulo export.

Tareas:
1. Crea apps/backend/src/modules/export/:
   - export.module.ts
   - export.controller.ts con GET /admin/export.
   - export.service.ts.
2. El endpoint:
   - Requiere AuthGuard estándar.
   - Adicionalmente valida el header X-Admin-Token contra
     process.env.ADMIN_EXPORT_TOKEN. Si no coincide, 403.
   - Acepta query params opcionales `desde` y `hasta` (ISO dates).
   - Responde con Content-Type: text/csv.
   - El CSV tiene exactamente las columnas listadas en docs/api-contract.md.
   - Una fila por evaluación finalizada.
   - Los nombres y códigos de usuario van en claro (es para análisis del
     investigador).
3. Asegúrate que el CSV escape correctamente comas y saltos de línea
   dentro de los campos.
4. Agrega ADMIN_EXPORT_TOKEN al .env.example con un valor placeholder.

Tests:
- GET /admin/export sin X-Admin-Token → 403.
- GET /admin/export con X-Admin-Token correcto → 200 con CSV.
- Verificar que el CSV tiene todas las columnas y al menos una fila tras
  ejecutar evaluaciones de prueba.
- Verificar que el filtro de fechas funciona.

Al terminar, ejecuta el endpoint y muéstrame las primeras 5 líneas del CSV.
```

**Verificación:**
```bash
curl http://localhost:3000/admin/export \
  -H "X-User-Id: <uuid>" \
  -H "X-Admin-Token: <token>" \
  -o export.csv
head -5 export.csv
```

---

## Paso 9 — Frontend: core e infraestructura

```
Lee docs/architecture.md sección Frontend y docs/api-contract.md sección
Notas para el frontend.

Implementa el core del frontend Angular.

Tareas:
1. Estructura inicial bajo apps/frontend/src/app/:
   - core/auth/auth.service.ts: maneja login, logout, persistencia en
     localStorage, exposición del usuario actual como signal o BehaviorSubject.
   - core/auth/auth.guard.ts: redirige a /login si no hay userId en
     localStorage.
   - core/api/api.service.ts: cliente HTTP tipado con métodos para cada
     endpoint del contrato (login, getProfile, getCourses, getTopics,
     startEvaluation, finalizeEvaluation).
   - core/api/api.interceptor.ts: HTTP interceptor que agrega
     X-User-Id a cada request automáticamente.
   - core/models/: interfaces TypeScript que reflejan los DTOs de
     docs/api-contract.md (Usuario, Curso, Tema, Pregunta, Opcion,
     Evaluacion, ResultadoEvaluacion, etc.).

2. AppComponent debe tener:
   - Un layout simple con header (logo + nombre del estudiante + botón
     logout) y main donde se rendericen las rutas hijas.
   - Un slot reservado en el layout para el futuro chatbot (un div con
     id="chatbot-slot" en posición fixed bottom-right). Por ahora vacío.

3. Configurar las rutas iniciales en app.routes.ts:
   - /login → componente Login (placeholder por ahora)
   - /home → componente Home (placeholder por ahora, protegido por AuthGuard)
   - /** → redirige a /home

4. Estilos globales: paleta sobria, tipografía grande (mínimo 16px base,
   18-20px para contenido principal), botones amplios. Usa una librería
   de UI ligera o tailwind si está configurado, o estilos propios bien
   organizados.

5. Variable de entorno API_BASE_URL apuntando a http://localhost:3000.

Al terminar, muéstrame que la app levanta, redirige correctamente a /login
si no hay sesión, y a /home si la hay (puedes setear localStorage manualmente
para probar).
```

**Verificación:**
```bash
pnpm --filter frontend dev
# Visitar http://localhost:4200, debe redirigir a /login
```

---

## Paso 10 — Frontend: pantallas de login y selección

```
Lee docs/api-contract.md (login, courses, topics) y CLAUDE.md.

Implementa las pantallas de login y selección de curso/tema.

Tareas:
1. apps/frontend/src/app/features/login/:
   - login.component con formulario reactivo (codigo + password).
   - Validación: ambos campos requeridos.
   - Al submit: llama a authService.login(), guarda usuario en
     localStorage, redirige a /home.
   - Muestra mensaje de error claro si las credenciales son inválidas.
   - Diseño centrado, simple, con logo del sistema.

2. apps/frontend/src/app/features/course-selection/:
   - course-selection.component: lista los cursos disponibles como
     tarjetas grandes y clickeables. Replica conceptualmente la Figura 13
     de la tesis.
   - Al click en un curso, navega a /courses/:cursoId/topics.

3. apps/frontend/src/app/features/topic-selection/:
   - topic-selection.component: lista los temas del curso seleccionado,
     agrupados por grado. Replica conceptualmente la Figura 14 de la tesis.
   - Cada tema es un botón grande clickeable.
   - Al click en un tema, navega a /evaluation/:temaId.

4. Configura las rutas correspondientes y protege con AuthGuard salvo
   /login.

5. /home redirige a /courses por defecto.

Al terminar, demuestra el flujo completo: login → ver cursos → ver temas
de un curso. Muestra screenshots o descripciones de cada pantalla.
```

**Verificación:**
- Login con VAL001 / pass1234 funciona.
- Tras login, se ven los cursos.
- Click en Matemática muestra los 4 temas.

---

## Paso 11 — Frontend: flujo de evaluación y resultados

```
Lee la sección Evaluaciones de docs/api-contract.md.

Implementa las pantallas de evaluación y resultados. Estas son las
pantallas más importantes del MVP.

Tareas:
1. apps/frontend/src/app/features/evaluation/:
   - evaluation.component:
     a. Al cargar con :temaId, llama a apiService.startEvaluation(temaId).
     b. Renderiza todas las preguntas en una sola pantalla, replicando la
        Figura 15 de la tesis: enunciado, opciones como radio buttons,
        botón "Finalizar evaluación" al final.
     c. Mide el tiempo desde que se cargan las preguntas hasta el click
        en "Finalizar evaluación". Para tiempoRespuestaSeg por pregunta,
        registra el momento del primer click en cada pregunta y calcula
        el delta hasta el siguiente click; alternativamente, usa el tiempo
        total dividido entre el número de preguntas si simplifica.
     d. Al finalizar, llama a apiService.finalizeEvaluation() con todas las
        respuestas y navega a /results pasando el resultado por estado de
        navegación o servicio.
     e. Validar que todas las preguntas estén respondidas antes de habilitar
        el botón finalizar.

2. apps/frontend/src/app/features/results/:
   - results.component:
     - Recibe el resultado de la evaluación (pasado desde evaluation o
       consultado por id).
     - Replica la Figura 16 de la tesis:
       * Sección "Desempeño de la evaluación": nota, aciertos, errores,
         tiempo promedio.
       * Sección "Retroalimentación del sistema": acción aplicada
         (bonita: "SUGERIR_EJERCICIOS_AVANZADOS" si subir, etc.) y mensaje
         adaptativo.
       * Sección "Puntos ganados para el Ranking": puntos obtenidos y
         posición actual.
       * Si hay logros desbloqueados, mostrarlos con un toast o sección
         destacada.
     - Botón "Volver a selección de temas" que navega a la pantalla
       anterior.

3. UX para niños de primaria:
   - Tipografía grande.
   - Espaciado generoso.
   - Feedback visual claro (verde para aciertos, mensajes de aliento).
   - Animaciones sutiles al revelar resultados (no obligatorio pero
     mejora la experiencia).

Al terminar, demuestra una evaluación completa end-to-end: seleccionar
tema → resolver preguntas → ver resultado con todos los componentes.
```

**Verificación:**
- El flujo completo funciona desde el login.
- Al finalizar una evaluación, los datos del backend se reflejan en
  la pantalla de resultados.

---

## Paso 12 — Frontend: perfil del estudiante e integración final

```
Lee la sección Estudiantes de docs/api-contract.md.

Implementa la pantalla de perfil y verifica la integración end-to-end.

Tareas:
1. apps/frontend/src/app/features/profile/:
   - profile.component:
     - Llama a apiService.getMyProfile() al cargar.
     - Replica la Figura 17 de la tesis:
       * Nombre del estudiante, puntos totales, ranking general.
       * Lista de cursos con puntos y ranking por curso.
       * Sección "Últimos logros" con los logros desbloqueados (nombre
         + descripción + ícono si está disponible).
     - Botón para ir a la selección de cursos.

2. Agrega un acceso al perfil en el header del AppComponent (un ícono
   o el nombre del usuario clickeable que lleve a /profile).

3. Configura la ruta /profile protegida por AuthGuard.

4. Verifica que después de completar varias evaluaciones, los puntos y
   logros se reflejen correctamente en el perfil.

5. Test end-to-end manual completo (ejecuta y reporta resultado):
   a. Logout (limpia localStorage).
   b. Login con un estudiante distinto, ej. DIE002.
   c. Selecciona un curso y un tema.
   d. Resuelve una evaluación con respuestas mayormente correctas.
   e. Verifica que la pantalla de resultados muestre la acción adaptativa
      "subir" y la dificultad aumentada.
   f. Resuelve una segunda evaluación en el mismo tema con respuestas
      mayormente incorrectas.
   g. Verifica que la acción adaptativa sea "bajar".
   h. Visita el perfil y confirma que aparezcan los logros desbloqueados
      y los puntos acumulados.
   i. Finalmente, ejecuta GET /admin/export y verifica que las dos
      evaluaciones aparezcan en el CSV con todas las métricas.

Al terminar, genera un README en la raíz del repositorio con:
- Descripción breve del proyecto.
- Cómo levantarlo desde cero (instalar deps, levantar Docker, migrations,
  seeds, dev servers).
- Credenciales de los 5 estudiantes de prueba.
- Lista de funcionalidades del MVP.
- Lista de funcionalidades diferidas a Fase 2 (link a docs/scope.md).

Reporta cualquier issue o inconsistencia que hayas encontrado durante
la verificación end-to-end.
```

**Verificación final:**
- Todo el flujo del estudiante funciona desde login hasta ver resultados
  y perfil actualizado.
- El motor adaptativo responde de forma coherente: sube dificultad cuando
  el desempeño es bueno, baja cuando es malo.
- Los logros se desbloquean según los criterios.
- El CSV de exportación contiene todos los datos necesarios para el
  análisis con paired t-test.

---

## Después del Paso 12

Tu MVP está listo para la validación. Próximos pasos sugeridos:

1. **Despliegue:** Configura un entorno de despliegue (Render, Railway,
   Fly.io, o similar) y prepara la URL pública para que los estudiantes
   accedan desde el aula de cómputo.

2. **Pre-validación:** Ejecuta una sesión piloto con 2-3 personas para
   detectar cualquier problema de UX o bugs antes de la intervención
   real.

3. **Capacitación al docente:** Comparte con el docente del salón el
   funcionamiento básico del sistema y los puntos clave del protocolo
   (ver capítulo de validación de la tesis).

4. **Carga de credenciales:** Crea las cuentas reales de los estudiantes
   participantes en lugar de los seeds (mantén los seeds solo para
   desarrollo).

Cuando quieras integrar las funcionalidades de Fase 2 (chatbot, aulas
virtuales, padres, etc.), agrega los prompts correspondientes a este
documento siguiendo el mismo patrón.
