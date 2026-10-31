import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthStore } from './auth.store';
import { ContextoStore } from './contexto.store';
import { SESSION_CONFIG } from './session.config';

/**
 * Exige sesión y una empresa + negocio activos.
 *
 * Espera a `asegurarSesion()` antes de mirar el contexto: en Angular los guards
 * de una misma ruta se resuelven en paralelo, y tras una recarga la sesión y el
 * contexto todavía pueden estar cargándose cuando este guard se ejecuta.
 */
export const contextoGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  const contextoStore = inject(ContextoStore);
  const config = inject(SESSION_CONFIG);
  const router = inject(Router);

  return auth.asegurarSesion().pipe(
    map((autenticado) => {
      if (!autenticado) {
        return router.createUrlTree(['/login']);
      }
      if (contextoStore.hayContexto()) {
        return true;
      }
      return router.createUrlTree([config.tenantPickerPath ?? '/empresas'], {
        queryParams: state.url && state.url !== '/' ? { returnUrl: state.url } : {},
      });
    }),
  );
};
