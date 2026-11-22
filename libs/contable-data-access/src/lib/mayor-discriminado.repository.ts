import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { MayorDiscriminadoDatos, MayorDiscriminadoFiltro } from './mayor.models';

/**
 * Contrato del Mayor Discriminado contra
 * `/api/tenant/core/reporte/mayor-discriminado`.
 */
export interface MayorDiscriminadoReporteRepository {
  datos(filtro: MayorDiscriminadoFiltro): Observable<MayorDiscriminadoDatos>;
  pdf(filtro: MayorDiscriminadoFiltro): Observable<Blob>;
  xlsx(filtro: MayorDiscriminadoFiltro): Observable<Blob>;
}

export const MAYOR_DISCRIMINADO_REPORTE_REPOSITORY =
  new InjectionToken<MayorDiscriminadoReporteRepository>(
    'MAYOR_DISCRIMINADO_REPORTE_REPOSITORY',
  );
