import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'courses',
    loadComponent: () =>
      import('./features/course-selection/course-selection.component').then(
        (m) => m.CourseSelectionComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'courses/:cursoId/topics',
    loadComponent: () =>
      import('./features/topic-selection/topic-selection.component').then(
        (m) => m.TopicSelectionComponent,
      ),
    canActivate: [authGuard],
  },
  // /home y raíz redirigen a courses; el authGuard en /courses hace el resto
  {
    path: 'home',
    redirectTo: 'courses',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: 'courses',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'courses',
  },
];
