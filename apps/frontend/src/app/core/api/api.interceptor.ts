import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const userId = auth.userId;
  const outgoing = userId
    ? req.clone({ setHeaders: { 'X-User-Id': userId } })
    : req;

  return next(outgoing).pipe(
    catchError((error) => {
      if (error.status === 401) {
        auth.cerrarSesion();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
