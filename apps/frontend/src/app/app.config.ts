import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { apiInterceptor } from './core/api/api.interceptor';

// Routing hash-based (#/login, #/home) para que funcione sin configuración
// de servidor en el aula de cómputo. En Fase 2 se puede migrar a path-based
// cuando haya un servidor con redirect configurado.
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([apiInterceptor])),
  ],
};
