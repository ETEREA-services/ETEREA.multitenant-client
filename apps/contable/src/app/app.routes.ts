import { Routes } from '@angular/router';
import {
  CambiarPasswordComponent,
  ContextoPageComponent,
  LoginComponent,
} from '@eterea/feature-session';
import {
  authGuard,
  contextoGuard,
  guestGuard,
  pendingPasswordChangeGuard,
} from '@eterea/shared-api';
import { AppShellComponent } from './shell/app-shell';

/**
 * Rutas raíz del cliente.
 *
 * - `/login` y `/empresas` quedan fuera del shell.
 * - `/empresas` exige sesión y obliga a elegir empresa y negocio.
 * - `feature-session` se importa de forma estática porque el shell también
 *   necesita el diálogo de cambio de contexto.
 */
export const appRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
    title: 'Ingresar · Contable',
  },
  {
    path: 'empresas',
    component: ContextoPageComponent,
    canActivate: [authGuard, pendingPasswordChangeGuard],
    title: 'Elegir contexto · Contable',
  },
  {
    path: 'cambiar-password',
    component: CambiarPasswordComponent,
    canActivate: [authGuard],
    title: 'Cambiar contraseña · Contable',
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard, pendingPasswordChangeGuard, contextoGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('@eterea/feature-contable').then((m) => m.CONTABLE_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
