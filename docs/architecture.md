# Arquitectura y patrones

## Backend (NestJS)

### Estructura de módulos

```
apps/backend/src/
├── main.ts
├── app.module.ts
├── modules/
│   ├── auth/                  # login simple en MVP, JWT después
│   ├── users/                 # CRUD de usuarios (en MVP solo lectura)
│   ├── courses/               # cursos, temas, preguntas (lectura)
│   ├── evaluations/           # crear, responder, finalizar evaluaciones
│   ├── adaptive/              # wrapper del adaptive-engine
│   ├── gamification/          # puntos y logros
│   └── export/                # exportación CSV para análisis
├── common/
│   ├── decorators/            # decoradores reutilizables (ej. CurrentUser)
│   ├── guards/                # guards de autenticación
│   ├── pipes/                 # pipes de validación
│   └── filters/               # exception filters
├── config/
│   ├── database.config.ts
│   └── env.config.ts
└── database/
    └── entities/              # entidades TypeORM
```

### Reglas de modularidad

- **Cada módulo es autocontenido.** Si el módulo `evaluations` necesita lógica del módulo `adaptive`, lo consume mediante el `AdaptiveService` exportado, nunca importando archivos internos.
- **Servicios con interfaces.** El `AuthService` del MVP es simple (verifica usuario y contraseña, devuelve `userId`). En Fase 2 se reemplaza por uno con JWT sin tocar a los consumidores.
- **DTOs en cada endpoint.** Validación con `class-validator`. Nunca aceptar `any` o cuerpos sin tipar.
- **Sin lógica de negocio en controllers.** Los controllers reciben, validan y delegan al servicio. La lógica vive en los servicios.

### El módulo adaptive

Es el wrapper del paquete `adaptive-engine`. Su responsabilidad:

1. Recibir el contexto del estudiante (métricas de la evaluación recién finalizada y nivel actual).
2. Llamar al `JSONRulesEngine` con ese contexto.
3. Devolver una decisión normalizada: `{ accion: 'subir' | 'mantener' | 'bajar', mensaje: string }`.

El `JSONRulesEngine` queda completamente desacoplado del resto del sistema. Si en el futuro se reemplaza por un modelo de ML, solo cambia este módulo.

## Frontend (Angular)

### Estructura

```
apps/frontend/src/app/
├── core/
│   ├── auth/                  # AuthService, AuthGuard
│   ├── api/                   # HTTP client tipado
│   └── models/                # interfaces compartidas
├── features/
│   ├── login/
│   ├── course-selection/
│   ├── evaluation/
│   ├── results/
│   └── profile/
├── shared/                    # componentes y pipes reutilizables
├── app.component.ts
├── app.routes.ts
└── app.config.ts
```

### Reglas

- **Layout con espacios reservados.** El `AppComponent` debe tener un slot lateral o flotante donde después se enchufa el chatbot (Fase 2) sin reorganizar nada.
- **Routing por feature.** Cada feature define sus propias rutas y se carga con lazy loading cuando sea posible.
- **Servicios singleton en `core/`.** Cualquier cosa que deba existir una sola vez en la app (auth, api client) va ahí.
- **Diseño orientado a primaria.** Tipografía grande, botones amplios, iconografía clara, contraste alto. Mobile-friendly sin ser mobile-first (la validación se hace en aula de cómputo).

## Patrón de autenticación con upgrade futuro

```typescript
// MVP — apps/backend/src/modules/auth/auth.service.ts
export interface AuthService {
  login(codigo: string, password: string): Promise<{ userId: string }>;
  validateUser(userId: string): Promise<User | null>;
}

// Implementación MVP: SimpleAuthService — verifica password con bcrypt
// y devuelve userId. El frontend lo guarda en localStorage.

// Fase 2: JwtAuthService implementa la misma interfaz pero devuelve un JWT
// y maneja refresh tokens. Los consumidores (controllers, guards) no cambian.
```

Este patrón aplica también a otros servicios que evolucionarán: notificaciones (logs ahora, correo después), recomendador (motor de reglas ahora, posible recomendador colaborativo después).

## Testing

- **Backend:** tests unitarios de servicios con jest. Tests de integración de endpoints con supertest.
- **Frontend:** tests unitarios de servicios y componentes críticos.
- **No es necesario alcanzar coberturas altas para el MVP.** Sí es obligatorio que los flujos del estudiante (login → seleccionar tema → resolver evaluación → ver resultado) tengan al menos un test de integración cada uno.

## Migraciones

- Cada cambio de schema va en una migration nueva, nunca editando una migration ya ejecutada.
- Los seeds son separados de las migrations y son idempotentes (se pueden correr varias veces sin romper).
- Antes de agregar tablas de Fase 2, revisar `docs/data-model.md` para asegurar consistencia de nombres.
