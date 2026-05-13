# Sistema Web de Tutoría Personalizada con IA y Gamificación

Tesis de Ingeniería de Sistemas. Sistema educativo para estudiantes de primaria
del Perú con motor de reglas adaptativas (JSONRulesEngine) y gamificación.

## Levantar desde cero

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear archivo de variables de entorno
cp .env.example .env
# Editar .env si se necesitan valores distintos

# 3. Levantar PostgreSQL
docker-compose up -d

# 4. Correr migrations (crear tablas)
pnpm --filter backend migration:run

# 5. Cargar datos de prueba
pnpm --filter backend seed:run

# 6. Levantar backend (puerto 3000)
pnpm --filter backend dev

# 7. Levantar frontend (puerto 4200) — en otra terminal
pnpm --filter frontend dev
```

## Verificar que todo funciona

```bash
# Backend health check
curl http://localhost:3000/health
# Esperado: { "status": "ok" }

# Frontend
# Abrir http://localhost:4200 en el navegador
```

## Credenciales de estudiantes de prueba

| Código  | Nombre                  | Contraseña |
|---------|-------------------------|------------|
| VAL001  | Valeria Torres Rojas    | pass1234   |
| DIE002  | Diego Salazar Mamani    | pass1234   |
| LUC003  | Luciana Rojas Castillo  | pass1234   |
| MAT004  | Mateo Quispe Vargas     | pass1234   |
| CAM005  | Camila Huamán Flores    | pass1234   |

## Funcionalidades del MVP (Fase 1)

- Login simple por código y contraseña
- Selección de curso, grado y tema
- Evaluación con preguntas de opción múltiple
- Motor adaptativo (sube/mantiene/baja dificultad según desempeño)
- Visualización de resultados con retroalimentación
- Gamificación: puntos por curso y logros desbloqueables
- Perfil del estudiante
- Exportación CSV para análisis (`GET /admin/export`)

## Funcionalidades diferidas (Fase 2)

Ver [docs/scope.md](docs/scope.md).

## Stack

- **Frontend:** Angular 19 — puerto 4200
- **Backend:** NestJS 10 + TypeORM — puerto 3000
- **Base de datos:** PostgreSQL 16
- **Monorepo:** pnpm workspaces
