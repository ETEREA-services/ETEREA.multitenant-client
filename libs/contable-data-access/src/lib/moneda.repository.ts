import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { MonedaInfo } from './moneda.models';

/**
 * Catálogo de monedas del tenant contra `GET /api/tenant/core/moneda`.
 *
 * Es compartido por todos los reportes; el header `X-Tenant-Id` lo agrega
 * `contextoInterceptor`.
 */
export interface MonedaRepository {
  listar(): Observable<readonly MonedaInfo[]>;
}

export const MONEDA_REPOSITORY = new InjectionToken<MonedaRepository>('MONEDA_REPOSITORY');
