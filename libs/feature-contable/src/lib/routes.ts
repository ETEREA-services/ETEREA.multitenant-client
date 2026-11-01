import { Routes } from '@angular/router';
import { BalancePageComponent } from './pages/balance/balance';
import { EjerciciosPageComponent } from './pages/ejercicios/ejercicios';
import {
  CoeficientesInflacionPageComponent,
  coeficientesPuedeSalirGuard,
} from './pages/inflacion/coeficientes/coeficientes';
import { CuentaPageComponent } from './pages/plan-cuentas/cuenta';
import { PlanCuentasReportePageComponent } from './pages/reportes/plan-cuentas/plan-cuentas-reporte';

/**
 * Rutas del módulo contable.
 *
 * Sólo se declaran las pantallas implementadas. El menú del shell y este
 * arreglo deben mantenerse alineados: una opción sin ruta (o al revés) es un
 * bug, no un placeholder.
 */
export const CONTABLE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'plan-cuentas' },
  {
    path: 'plan-cuentas',
    component: CuentaPageComponent,
    title: 'Plan de cuentas · Contable',
  },
  {
    path: 'reportes/plan-cuentas',
    component: PlanCuentasReportePageComponent,
    title: 'Plan de Cuentas · Contable',
  },
  { path: 'balance', component: BalancePageComponent, title: 'Balance · Contable' },
  { path: 'ejercicios', component: EjerciciosPageComponent, title: 'Ejercicios · Contable' },
  {
    path: 'inflacion/coeficientes',
    component: CoeficientesInflacionPageComponent,
    canDeactivate: [coeficientesPuedeSalirGuard],
    title: 'Coeficientes de inflación · Contable',
  },
  { path: '**', redirectTo: '' },
];
