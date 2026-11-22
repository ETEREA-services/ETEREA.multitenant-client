import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { API_URL } from '@eterea/shared-api';
import { reporteErrorDesdeHttp } from './plan-cuentas-reporte-error';
import { MonedaInfo, MonedasResponse } from './moneda.models';
import { MonedaRepository } from './moneda.repository';

/** Implementación HTTP del catálogo de monedas compartido. */
@Injectable()
export class MonedaHttpRepository implements MonedaRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  listar(): Observable<readonly MonedaInfo[]> {
    return this.http.get<MonedasResponse>(`${this.apiUrl}/moneda`).pipe(
      map((respuesta) => respuesta.monedas),
      catchError(reporteErrorDesdeHttp),
    );
  }
}
