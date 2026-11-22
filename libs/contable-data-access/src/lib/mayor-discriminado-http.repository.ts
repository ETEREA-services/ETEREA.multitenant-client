import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError } from 'rxjs';
import { API_URL } from '@eterea/shared-api';
import { MayorDiscriminadoDatos, MayorDiscriminadoFiltro } from './mayor.models';
import { MayorDiscriminadoReporteRepository } from './mayor-discriminado.repository';
import { reporteErrorDesdeHttp } from './plan-cuentas-reporte-error';

/** Implementación HTTP del reporte Mayor Discriminado. */
@Injectable()
export class MayorDiscriminadoHttpRepository implements MayorDiscriminadoReporteRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private get base(): string {
    return `${this.apiUrl}/reporte/mayor-discriminado`;
  }

  datos(filtro: MayorDiscriminadoFiltro): Observable<MayorDiscriminadoDatos> {
    return this.http
      .post<MayorDiscriminadoDatos>(`${this.base}/datos`, filtro)
      .pipe(catchError(reporteErrorDesdeHttp));
  }

  pdf(filtro: MayorDiscriminadoFiltro): Observable<Blob> {
    return this.http
      .post(`${this.base}/pdf`, filtro, { responseType: 'blob' })
      .pipe(catchError(reporteErrorDesdeHttp));
  }

  xlsx(filtro: MayorDiscriminadoFiltro): Observable<Blob> {
    return this.http
      .post(`${this.base}/xlsx`, filtro, { responseType: 'blob' })
      .pipe(catchError(reporteErrorDesdeHttp));
  }
}
