import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from '@eterea/shared-api';
import { Cuenta, CuentaInput, CuentaNodo, CuentaUpdateInput } from './cuenta.models';
import { CuentaRepository } from './cuenta.repository';

/** Normaliza `cuentaMaestro`, que el backend puede devolver como `null`. */
function normalizarCuenta(cuenta: Cuenta): Cuenta {
  return { ...cuenta, cuentaMaestro: cuenta.cuentaMaestro ?? 0 };
}

function normalizarNodo(nodo: CuentaNodo): CuentaNodo {
  return {
    ...nodo,
    cuenta: normalizarCuenta(nodo.cuenta),
    hijos: nodo.hijos.map(normalizarNodo),
  };
}

/** Implementación HTTP del plan de cuentas contra `/api/tenant/core/cuenta`. */
@Injectable()
export class CuentaHttpRepository implements CuentaRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listar(): Observable<readonly Cuenta[]> {
    return this.http
      .get<readonly Cuenta[]>(`${this.apiUrl}/cuenta`)
      .pipe(map((cuentas) => cuentas.map(normalizarCuenta)));
  }

  arbol(): Observable<readonly CuentaNodo[]> {
    return this.http
      .get<readonly CuentaNodo[]>(`${this.apiUrl}/cuenta/arbol`)
      .pipe(map((nodos) => nodos.map(normalizarNodo)));
  }

  obtenerDetalle(numeroCuenta: number): Observable<Cuenta> {
    return this.http
      .get<Cuenta>(`${this.apiUrl}/cuenta/${this.codigo(numeroCuenta)}/detalle`)
      .pipe(map(normalizarCuenta));
  }

  crear(input: CuentaInput): Observable<Cuenta> {
    return this.http.post<Cuenta>(`${this.apiUrl}/cuenta`, input).pipe(map(normalizarCuenta));
  }

  actualizar(numeroCuenta: number, input: CuentaUpdateInput): Observable<Cuenta> {
    return this.http
      .put<Cuenta>(`${this.apiUrl}/cuenta/${this.codigo(numeroCuenta)}`, input)
      .pipe(map(normalizarCuenta));
  }

  eliminar(numeroCuenta: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cuenta/${this.codigo(numeroCuenta)}`);
  }

  private codigo(numeroCuenta: number): string {
    return encodeURIComponent(String(numeroCuenta));
  }
}
