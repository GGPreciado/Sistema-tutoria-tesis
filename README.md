# Sistema Web de Tutoría Personalizada con IA y Gamificación

Sistema educativo web para estudiantes de primaria del Perú que combina un motor de reglas adaptativas (JSONRulesEngine) con gamificación. Desarrollado como herramienta de validación experimental para una tesis de Ingeniería de Sistemas, mediante un diseño pretest–postest con paired t-test aplicado a un salón de clases durante 3–4 semanas de intervención.

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

## Exportar datos del experimento

```bash
curl -H "X-User-Id: <uuid-de-cualquier-estudiante>" \
     -H "X-Admin-Token: <valor-de-ADMIN_EXPORT_TOKEN-en-.env>" \
     "http://localhost:3000/admin/export" \
     -o evaluaciones.csv
```

El CSV incluye: usuario, evaluación, curso, tema, grado, nota, aciertos/errores, rachas, tiempo promedio, índice de desempeño, dificultad actual, acción adaptativa y puntos. Insumo directo para el análisis con paired t-test.

## Funcionalidades diferidas — Fase 2

Ver detalle completo en [docs/scope.md](docs/scope.md).

- **Sprint 2:** Aulas virtuales, asignación de ejercicios por tutores, panel de monitoreo, chat interno y reuniones virtuales.
- **Sprint 3:** Asistente virtual (chatbot con API de Claude), perfil personalizado con foto, interacción entre estudiantes.
- **Sprint 4:** Registro público, autenticación JWT, recuperación de contraseña.
- **Sprint 5:** Vinculación padre–estudiante, reportes por correo, panel de administración.

## Stack

- **Frontend:** Angular 19 — puerto 4200
- **Backend:** NestJS 10 + TypeORM — puerto 3000
- **Base de datos:** PostgreSQL 16
- **Monorepo:** pnpm workspaces
