import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteDatos } from '@eterea/reporte-shared';
import { BalanceFiltro, MonedaInfo } from './balance-reporte.models';

/**
 * Contrato del reporte de balance contra
 * `/api/tenant/core/reporte/balance`.
 *
 * El header `X-Tenant-Id` lo agrega `contextoInterceptor`; la pantalla nunca
 * envía el negocio en el body.
 */
export interface BalanceReporteRepository {
  datos(filtro: BalanceFiltro): Observable<ReporteDatos>;
  pdf(filtro: BalanceFiltro): Observable<Blob>;
  xlsx(filtro: BalanceFiltro): Observable<Blob>;
  monedas(): Observable<readonly MonedaInfo[]>;
}

export const BALANCE_REPORTE_REPOSITORY =
  new InjectionToken<BalanceReporteRepository>('BALANCE_REPORTE_REPOSITORY');
