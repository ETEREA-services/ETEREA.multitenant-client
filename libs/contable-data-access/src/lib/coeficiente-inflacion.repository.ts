import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CoeficienteInflacionAnio,
  CoeficienteInflacionAnioInput,
} from './coeficiente-inflacion.models';

/**
 * Contrato de acceso a datos de coeficientes de inflación contra
 * `/api/tenant/core/coeficiente-inflacion`.
 *
 * El header `X-Tenant-Id` lo agrega `contextoInterceptor`.
 */
export interface CoeficienteInflacionRepository {
  listarAnios(): Observable<readonly number[]>;
  obtenerAnio(anho: number): Observable<CoeficienteInflacionAnio>;
  guardarAnio(
    anho: number,
    input: CoeficienteInflacionAnioInput,
  ): Observable<CoeficienteInflacionAnio>;
}

export const COEFICIENTE_INFLACION_REPOSITORY =
  new InjectionToken<CoeficienteInflacionRepository>(
    'COEFICIENTE_INFLACION_REPOSITORY',
  );
