import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Cuenta,
  CuentaBusqueda,
  CuentaInput,
  CuentaNodo,
  CuentaUpdateInput,
} from './cuenta.models';

/**
 * Contrato de acceso a datos del plan de cuentas contra
 * `/api/tenant/core/cuenta`.
 *
 * La UI depende sólo de este contrato; el header `X-Tenant-Id` lo agrega
 * `contextoInterceptor`.
 */
export interface CuentaRepository {
  listar(): Observable<readonly Cuenta[]>;
  arbol(): Observable<readonly CuentaNodo[]>;
  /** Búsqueda legacy: nombre, imputables, orden por nombre, máximo 20. */
  buscar(texto: string): Observable<readonly CuentaBusqueda[]>;
  obtenerDetalle(numeroCuenta: number): Observable<Cuenta>;
  crear(input: CuentaInput): Observable<Cuenta>;
  actualizar(numeroCuenta: number, input: CuentaUpdateInput): Observable<Cuenta>;
  eliminar(numeroCuenta: number): Observable<void>;
}

export const CUENTA_REPOSITORY = new InjectionToken<CuentaRepository>('CUENTA_REPOSITORY');
