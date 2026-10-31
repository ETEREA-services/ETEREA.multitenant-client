import { Routes } from '@angular/router';
import { AsientosPageComponent } from './pages/asientos/asientos';
import { BalancePageComponent } from './pages/balance/balance';
import { CentrosCostoPageComponent } from './pages/centros-costo/centros-costo';
import { ConfiguracionPageComponent } from './pages/configuracion/configuracion';
import { EjerciciosPageComponent } from './pages/ejercicios/ejercicios';
import {
  CoeficientesInflacionPageComponent,
  coeficientesPuedeSalirGuard,
} from './pages/inflacion/coeficientes/coeficientes';
import { MayorPageComponent } from './pages/mayor/mayor';
import { PeriodosPageComponent } from './pages/periodos/periodos';
import { CuentaPageComponent } from './pages/plan-cuentas/cuenta';
import { PlanCuentasReportePageComponent } from './pages/reportes/plan-cuentas/plan-cuentas-reporte';
import { ResumenPageComponent } from './pages/resumen/resumen';

export const CONTABLE_ROUTES: Routes = [
  { path: '', component: ResumenPageComponent, title: 'Resumen · Contable' },
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
  { path: 'asientos', component: AsientosPageComponent, title: 'Asientos · Contable' },
  { path: 'mayor', component: MayorPageComponent, title: 'Libro mayor · Contable' },
  { path: 'balance', component: BalancePageComponent, title: 'Balance · Contable' },
  { path: 'ejercicios', component: EjerciciosPageComponent, title: 'Ejercicios · Contable' },
  {
    path: 'inflacion/coeficientes',
    component: CoeficientesInflacionPageComponent,
    canDeactivate: [coeficientesPuedeSalirGuard],
    title: 'Coeficientes de inflación · Contable',
  },
  { path: 'periodos', component: PeriodosPageComponent, title: 'Períodos · Contable' },
  {
    path: 'centros-costo',
    component: CentrosCostoPageComponent,
    title: 'Centros de costo · Contable',
  },
  {
    path: 'configuracion',
    component: ConfiguracionPageComponent,
    title: 'Configuración · Contable',
  },
  { path: '**', redirectTo: '' },
];
