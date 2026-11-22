import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { MayorDatos, MayorFiltro } from './mayor.models';

/**
 * Contrato del reporte Mayor contra `/api/tenant/core/reporte/mayor`.
 *
 * El header `X-Tenant-Id` lo agrega `contextoInterceptor`; la pantalla nunca
 * envía el negocio en el body.
 */
export interface MayorReporteRepository {
  datos(filtro: MayorFiltro): Observable<MayorDatos>;
  pdf(filtro: MayorFiltro): Observable<Blob>;
  xlsx(filtro: MayorFiltro): Observable<Blob>;
}

export const MAYOR_REPORTE_REPOSITORY =
  new InjectionToken<MayorReporteRepository>('MAYOR_REPORTE_REPOSITORY');
