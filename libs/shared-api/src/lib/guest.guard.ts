import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from './auth.store';

/** Evita que un usuario con sesión vuelva al login. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  return auth
    .asegurarSesion()
    .pipe(map((autenticado) => (autenticado ? router.createUrlTree([auth.rutaPostLogin()]) : true)));
};
