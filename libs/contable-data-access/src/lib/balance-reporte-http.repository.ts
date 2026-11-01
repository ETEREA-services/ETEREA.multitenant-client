import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { ReporteDatos } from '@eterea/reporte-shared';
import { API_URL } from '@eterea/shared-api';
import { reporteErrorDesdeHttp } from './plan-cuentas-reporte-error';
import { BalanceFiltro, MonedaInfo, MonedasResponse } from './balance-reporte.models';
import { BalanceReporteRepository } from './balance-reporte.repository';

/** Implementación HTTP del reporte de balance. */
@Injectable()
export class BalanceReporteHttpRepository implements BalanceReporteRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private get base(): string {
    return `${this.apiUrl}/reporte/balance`;
  }

  datos(filtro: BalanceFiltro): Observable<ReporteDatos> {
    return this.http
      .post<ReporteDatos>(`${this.base}/datos`, filtro)
      .pipe(catchError(reporteErrorDesdeHttp));
  }

  pdf(filtro: BalanceFiltro): Observable<Blob> {
    return this.http
      .post(`${this.base}/pdf`, filtro, { responseType: 'blob' })
      .pipe(catchError(reporteErrorDesdeHttp));
  }

  xlsx(filtro: BalanceFiltro): Observable<Blob> {
    return this.http
      .post(`${this.base}/xlsx`, filtro, { responseType: 'blob' })
      .pipe(catchError(reporteErrorDesdeHttp));
  }

  monedas(): Observable<readonly MonedaInfo[]> {
    return this.http
      .get<MonedasResponse>(`${this.base}/monedas`)
      .pipe(
        map((respuesta) => respuesta.monedas),
        catchError(reporteErrorDesdeHttp),
      );
  }
}
