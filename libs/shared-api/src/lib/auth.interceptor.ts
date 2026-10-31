import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from './auth.store';

const AUTH_RETRY = new HttpContextToken<boolean>(() => false);
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

/** Evita que un 401 de este request dispare el refresh de sesión. */
export const SKIP_AUTH_REFRESH = new HttpContextToken<boolean>(() => false);

/** Adjunta el access token y reintenta una vez tras refrescar la sesión. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const injector = inject(Injector);
  const router = inject(Router);
  const auth = injector.get(AuthStore);

  const esEndpointPublico = PUBLIC_AUTH_PATHS.some((path) => request.url.includes(path));
  const token = auth.accessToken();
  const requestAutenticada =
    token && !esEndpointPublico
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(requestAutenticada).pipe(
    catchError((error: unknown) => {
      const requiereCambioPassword =
        error instanceof HttpErrorResponse &&
        error.status === 403 &&
        (error.error as { code?: string } | null)?.code === 'PASSWORD_CHANGE_REQUIRED';

      if (requiereCambioPassword) {
        void router.navigate(['/cambiar-password']);
        return throwError(() => error);
      }

      const esNoAutorizado = error instanceof HttpErrorResponse && error.status === 401;
      if (
        !esNoAutorizado ||
        esEndpointPublico ||
        request.context.get(AUTH_RETRY) ||
        request.context.get(SKIP_AUTH_REFRESH)
      ) {
        return throwError(() => error);
      }

      return auth.refrescar().pipe(
        switchMap((refrescado) => {
          if (!refrescado) {
            void router.navigate(['/login']);
            return throwError(() => error);
          }

          const nuevoToken = auth.accessToken();
          return next(
            requestAutenticada.clone({
              context: requestAutenticada.context.set(AUTH_RETRY, true),
              setHeaders: nuevoToken ? { Authorization: `Bearer ${nuevoToken}` } : {},
            }),
          );
        }),
      );
    }),
  );
};
