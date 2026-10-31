import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteDatos } from '@eterea/reporte-shared';

/**
 * Contrato del listado/PDF del plan de cuentas contra
 * `/api/tenant/core/reporte/plan-cuentas`.
 *
 * El header `X-Tenant-Id` lo agrega `contextoInterceptor`; la pantalla nunca
 * envía el negocio en el body.
 */
export interface PlanCuentasReporteRepository {
  datos(): Observable<ReporteDatos>;
  pdf(): Observable<Blob>;
}

export const PLAN_CUENTAS_REPORTE_REPOSITORY =
  new InjectionToken<PlanCuentasReporteRepository>('PLAN_CUENTAS_REPORTE_REPOSITORY');
