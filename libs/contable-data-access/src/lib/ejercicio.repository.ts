import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Ejercicio, EjercicioInput, SiguienteEjercicio } from './ejercicio.models';

/**
 * Contrato de acceso a datos de ejercicios contra
 * `/api/tenant/core/ejercicio`.
 *
 * El header `X-Tenant-Id` lo agrega `contextoInterceptor`.
 */
export interface EjercicioRepository {
  listar(): Observable<readonly Ejercicio[]>;
  obtener(ejercicioId: number): Observable<Ejercicio>;
  siguiente(): Observable<SiguienteEjercicio>;
  crear(input: EjercicioInput): Observable<Ejercicio>;
  actualizar(ejercicioId: number, input: EjercicioInput): Observable<Ejercicio>;
  cambiarBloqueo(ejercicioId: number, bloqueado: boolean): Observable<Ejercicio>;
  eliminar(ejercicioId: number): Observable<void>;
}

export const EJERCICIO_REPOSITORY = new InjectionToken<EjercicioRepository>(
  'EJERCICIO_REPOSITORY',
);
