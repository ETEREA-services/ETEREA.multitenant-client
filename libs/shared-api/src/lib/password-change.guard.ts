import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from './auth.store';

/**
 * Si el usuario tiene una contraseña temporal pendiente, lo envía al cambio
 * obligatorio antes de dejarlo entrar al resto de la aplicación.
 */
export const pendingPasswordChangeGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  return auth
    .asegurarSesion()
    .pipe(
      map((autenticado) =>
        !autenticado || !auth.passwordChangeRequired()
          ? true
          : router.createUrlTree(['/cambiar-password']),
      ),
    );
};
