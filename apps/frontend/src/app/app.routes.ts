import { Routes } from '@angular/router';

// Las rutas de features se agregan aquí a medida que se implementan.
// Cada feature usa lazy loading para reducir el bundle inicial.
// AuthGuard se agrega en el Paso 9 del sprint-mvp.md.
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then(
        (m) => m.HomeComponent,
      ),
    // canActivate: [AuthGuard] — se agrega en el Paso 9
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
