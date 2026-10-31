import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard, pendingPasswordChangeGuard } from '@eterea/shared-api';
import { AppShellComponent } from './shell/app-shell';

/**
 * Rutas raíz del cliente administrador.
 *
 * - `/login` queda fuera del shell y reutiliza el login compartido.
 * - El módulo de administración se carga de forma lazy desde
 *   `@eterea/feature-administrador`.
 * - La autenticación real se conecta en un paso posterior.
 */
export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('@eterea/feature-session').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Ingresar · Administrador',
  },
  {
    path: 'cambiar-password',
    loadComponent: () => import('@eterea/feature-session').then((m) => m.CambiarPasswordComponent),
    canActivate: [authGuard],
    title: 'Cambiar contraseña · Administrador',
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard, pendingPasswordChangeGuard, adminGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('@eterea/feature-administrador').then((m) => m.ADMINISTRADOR_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
