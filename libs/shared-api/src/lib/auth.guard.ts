import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from './auth.store';

/** Exige una sesión válida. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  return auth
    .asegurarSesion()
    .pipe(map((autenticado) => (autenticado ? true : router.createUrlTree(['/login']))));
};
