import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from './auth.store';

/** Exige sesión y la autoridad de administrador. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  return auth.asegurarSesion().pipe(
    map((autenticado) => {
      if (!autenticado) {
        return router.createUrlTree(['/login']);
      }
      if (auth.esAdministrador()) {
        return true;
      }
      auth.logout();
      return router.createUrlTree(['/login']);
    }),
  );
};
