# Sistema Web de Tutoría Personalizada con IA y Gamificación

## Contexto académico

Este proyecto es parte de una tesis de Ingeniería de Sistemas. Implementa un sistema web educativo para estudiantes de primaria del Perú que integra un motor de reglas adaptativas (IA) y elementos de gamificación. La validación del sistema se realiza mediante un diseño pretest–postest con paired t-test aplicado a un único salón de clases durante 3 a 4 semanas de intervención.

## Principio rector: MVP primero, extensible siempre

El desarrollo se organiza en dos fases:

- **Fase 1 (MVP — necesario para la validación de tesis):** flujo mínimo para que estudiantes de primaria puedan usar el sistema durante la intervención. Ver `docs/scope.md`.
- **Fase 2 (post-validación):** funcionalidades restantes (aulas virtuales, chatbot, supervisión familiar, administración).

**Toda decisión arquitectónica debe favorecer la integración futura de la Fase 2 sin reescritura.** En la práctica esto significa:

- Nombrar entidades de forma genérica desde el inicio (ej. `usuarios` con campo `rol`, no `estudiantes` aislado).
- Mantener cada módulo NestJS independiente y autocontenido.
- Definir interfaces de servicios que puedan tener implementaciones intercambiables (ej. `AuthService` simple ahora, JWT después).
- Layout del frontend con espacios reservados para futuras secciones (chatbot flotante, panel de tutor, etc.).

## Stack tecnológico

- **Frontend:** Angular (versión LTS más reciente)
- **Backend:** Node.js + NestJS
- **Base de datos:** PostgreSQL
- **ORM:** TypeORM
- **Motor adaptativo:** JSONRulesEngine (existente, se migra como `packages/adaptive-engine`)
- **Gestor de monorepo:** pnpm workspaces

## Estructura del repositorio

```
sistema-tutoria/
├── apps/
│   ├── frontend/              # Angular
│   └── backend/               # NestJS
├── packages/
│   └── adaptive-engine/       # JSONRulesEngine (código existente migrado)
├── database/
│   ├── migrations/            # versionado de schema
│   └── seeds/                 # datos de prueba (cursos, temas, preguntas)
├── docs/
│   ├── scope.md               # qué construir ahora (MVP) y qué viene después
│   ├── data-model.md          # schema de la base de datos
│   └── architecture.md        # convenciones técnicas y patrones
├── docker-compose.yml         # PostgreSQL local
├── .env.example
├── package.json               # workspaces de pnpm
└── CLAUDE.md
```

## Convenciones

**Base de datos**
- Tablas en `snake_case` plural en español: `usuarios`, `respuestas_evaluacion`.
- Columnas en `snake_case` español.
- Toda tabla tiene: `id` (uuid o serial), `creado_en`, `actualizado_en` (cuando aplique).

**Backend (NestJS)**
- Endpoints REST en inglés y kebab-case: `/students/:id/profile`, `/evaluations`.
- Un módulo por feature (auth, courses, evaluations, adaptive, gamification).
- DTOs con validación (class-validator) en cada endpoint.
- Servicios con interfaces explícitas para favorecer pruebas y reemplazos.

**Frontend (Angular)**
- Componentes con prefijo `app-`.
- Una carpeta `features/` con un subdirectorio por pantalla principal.
- Una carpeta `core/` para servicios singleton (auth, api client).
- Una carpeta `shared/` para componentes y pipes reutilizables.

**Código en general**
- Variables, funciones y archivos en `camelCase` (TypeScript estándar).
- Comentarios en español (es código de tesis).
- Sin `any`. Tipos explícitos siempre.

## Comandos clave

```bash
# Instalar todo
pnpm install

# Levantar PostgreSQL local
docker-compose up -d

# Migrations y seeds
pnpm --filter backend migration:run
pnpm --filter backend seed:run

# Levantar backend (puerto 3000)
pnpm --filter backend dev

# Levantar frontend (puerto 4200)
pnpm --filter frontend dev

# Tests
pnpm test
```

## Cómo trabajar con este proyecto

1. Antes de implementar cualquier feature, lee `docs/scope.md` para confirmar si está dentro del MVP o no.
2. Antes de tocar la base de datos, lee `docs/data-model.md`.
3. Antes de crear un módulo nuevo, lee `docs/architecture.md`.
4. Si una decisión técnica podría afectar la integración futura de Fase 2, mencionalo explícitamente y pregunta antes de proceder.
