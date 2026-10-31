import { Routes } from '@angular/router';
import { AsignacionesPageComponent } from './pages/asignaciones/asignaciones';
import { ConfiguracionPageComponent } from './pages/configuracion/configuracion';
import { EmpresasPageComponent } from './pages/empresas/empresas';
import { NegociosPageComponent } from './pages/negocios/negocios';
import { ResumenPageComponent } from './pages/resumen/resumen';
import { UsuariosPageComponent } from './pages/usuarios/usuarios';

export const ADMINISTRADOR_ROUTES: Routes = [
  { path: '', component: ResumenPageComponent, title: 'Resumen · Administrador' },
  { path: 'empresas', component: EmpresasPageComponent, title: 'Empresas · Administrador' },
  { path: 'negocios', component: NegociosPageComponent, title: 'Negocios · Administrador' },
  { path: 'usuarios', component: UsuariosPageComponent, title: 'Usuarios · Administrador' },
  {
    path: 'asignaciones/:usuarioId',
    component: AsignacionesPageComponent,
    title: 'Asignaciones · Administrador',
  },
  {
    path: 'asignaciones',
    component: AsignacionesPageComponent,
    title: 'Asignaciones · Administrador',
  },
  {
    path: 'configuracion',
    component: ConfiguracionPageComponent,
    title: 'Configuración · Administrador',
  },
  { path: '**', redirectTo: '' },
];
